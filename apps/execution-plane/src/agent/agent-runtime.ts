import { randomUUID } from 'crypto';

import {
  AgentState,
  AgentStatus,
  BehaviorModel,
  BehaviorNode,
  HttpAction,
  SimForgeEventType,
  WaitAction,
} from '@simforge/shared';

import { HttpAdapter, HttpResult } from '../adapters/http/http.adapter';
import { TokenBucket } from '../worker/token-bucket';
import { SeededRandom } from './seeded-random';
import { RegionProfile, applyRegionProfile } from './region-profile';

const MAX_STEPS = 10_000;
const MAX_HISTORY = 8;
const LOOP_THRESHOLD = 5;

export type EventEmitter = (type: SimForgeEventType, payload: object) => Promise<void>;

export class AgentRuntime {
  private readonly state: AgentState;
  private readonly rng: SeededRandom;

  constructor(
    private readonly model: BehaviorModel,
    private readonly http: HttpAdapter,
    private readonly _rateLimiter: TokenBucket,
    private readonly emit: EventEmitter,
    private readonly runId: string,
    private readonly shardId: string,
    private readonly workerId: string,
    entropySeed: number,
    private readonly regionProfile?: RegionProfile,
  ) {
    this.rng = new SeededRandom(entropySeed);
    this.state = {
      agentId: randomUUID(),
      runId,
      shardId,
      currentNodeId: model.entryNodeId,
      sessionToken: randomUUID(),
      historyRing: [],
      cooldownUntil: 0,
      retryCount: 0,
      entropySeed,
      customKv: {},
      status: AgentStatus.SPAWNED,
      spawnedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };
  }

  get agentId(): string {
    return this.state.agentId;
  }

  async run(): Promise<void> {
    await this.emit(SimForgeEventType.AGENT_SPAWNED, {
      agentId: this.state.agentId,
      behaviorModelId: this.model.id,
      entryNodeId: this.model.entryNodeId,
      regionCode: this.regionProfile?.regionCode ?? null,
      countryCode: this.regionProfile?.countryCode ?? null,
      label: this.regionProfile?.label ?? null,
    });

    this.state.status = AgentStatus.ACTIVE;
    let steps = 0;

    while (this.state.status === AgentStatus.ACTIVE) {
      if (++steps > MAX_STEPS) return this.fail('max_steps_exceeded');

      const node = this.model.nodes[this.state.currentNodeId];
      if (!node) return this.fail(`node_not_found:${this.state.currentNodeId}`);

      if (node.type === 'abort') {
        this.state.status = AgentStatus.COMPLETED;
        await this.emit(SimForgeEventType.AGENT_COMPLETED, {
          agentId: this.state.agentId,
          finalNodeId: node.id,
          steps,
          regionCode: this.regionProfile?.regionCode ?? null,
          countryCode: this.regionProfile?.countryCode ?? null,
        });
        return;
      }

      if (this.isLooping()) {
        this.state.status = AgentStatus.LOOP_DETECTED;
        await this.emit(SimForgeEventType.AGENT_LOOP_DETECTED, {
          agentId: this.state.agentId,
          nodeId: this.state.currentNodeId,
          regionCode: this.regionProfile?.regionCode ?? null,
        });
        return;
      }

      const now = Date.now();
      if (this.state.cooldownUntil > now) await sleep(this.state.cooldownUntil - now);

      // Apply region-specific think time jitter on top of node think time
      const think = this.sampleThinkTime(node);
      const regionJitter = this.regionProfile
        ? Math.round(this.rng.next() * this.regionProfile.jitterMs)
        : 0;
      if (think + regionJitter > 0) await sleep(think + regionJitter);

      let result: HttpResult | null = null;

      if (node.type === 'http' && node.action) {
        result = await this.executeHttp(node, node.action as HttpAction);
      } else if (node.type === 'wait' && node.action) {
        const w = node.action as WaitAction;
        const jitter = (this.rng.next() * 2 - 1) * w.jitterMs;
        await sleep(Math.max(0, w.durationMs + jitter));
      }

      if (node.cooldownMs > 0) this.state.cooldownUntil = Date.now() + node.cooldownMs;

      const nextId = this.selectTransition(node, result);

      if (!nextId) {
        this.state.status = AgentStatus.COMPLETED;
        await this.emit(SimForgeEventType.AGENT_COMPLETED, {
          agentId: this.state.agentId,
          steps,
          regionCode: this.regionProfile?.regionCode ?? null,
          countryCode: this.regionProfile?.countryCode ?? null,
        });
        return;
      }

      await this.emit(SimForgeEventType.AGENT_STATE_CHANGED, {
        agentId: this.state.agentId,
        fromNodeId: this.state.currentNodeId,
        toNodeId: nextId,
        regionCode: this.regionProfile?.regionCode ?? null,
      });

      this.pushHistory(this.state.currentNodeId);
      this.state.currentNodeId = nextId;
      this.state.retryCount = 0;
      this.state.lastActiveAt = new Date().toISOString();
    }
  }

  private async executeHttp(node: BehaviorNode, action: HttpAction): Promise<HttpResult> {
    await this.emit(SimForgeEventType.ACTION_EXECUTED, {
      agentId: this.state.agentId,
      nodeId: node.id,
      method: action.method,
      regionCode: this.regionProfile?.regionCode ?? null,
      countryCode: this.regionProfile?.countryCode ?? null,
    });

    // Apply region-specific headers and user agent
    const regionHeaders = this.regionProfile
      ? applyRegionProfile(this.regionProfile, this.rng)
      : {};

    const result = await this.http.execute(
      { ...action, headers: { ...action.headers, ...regionHeaders } },
      {
        sessionToken: this.state.sessionToken,
        agentId: this.state.agentId,
        ...this.state.customKv,
      },
    );

    // Simulate region packet loss
    const packetLost = this.regionProfile && this.rng.next() < this.regionProfile.packetLossRate;

    if (result.error || packetLost) {
      this.state.retryCount++;

      // Region-specific retry rate check
      const shouldRetry = !this.regionProfile || this.rng.next() < this.regionProfile.retryRate;

      if (this.state.retryCount > node.maxRetries || !shouldRetry) {
        await this.emit(SimForgeEventType.ACTION_DLQ_SENT, {
          agentId: this.state.agentId,
          nodeId: node.id,
          error: packetLost ? 'packet_loss' : result.error,
          regionCode: this.regionProfile?.regionCode ?? null,
          countryCode: this.regionProfile?.countryCode ?? null,
        });
      } else {
        await this.emit(SimForgeEventType.ACTION_RETRIED, {
          agentId: this.state.agentId,
          nodeId: node.id,
          retryCount: this.state.retryCount,
          regionCode: this.regionProfile?.regionCode ?? null,
        });
      }
    } else {
      // Add region latency on top of actual latency
      const regionLatency = this.regionProfile ? this.sampleRegionLatency() : 0;

      await this.emit(SimForgeEventType.RESPONSE_RECEIVED, {
        agentId: this.state.agentId,
        statusCode: result.statusCode,
        latencyMs: result.latencyMs + regionLatency,
        actualLatencyMs: result.latencyMs,
        regionLatencyMs: regionLatency,
        nodeId: node.id,
        bodyHash: result.bodyHash,
        regionCode: this.regionProfile?.regionCode ?? null,
        countryCode: this.regionProfile?.countryCode ?? null,
      });
    }

    return result;
  }

  private sampleRegionLatency(): number {
    if (!this.regionProfile) return 0;
    const { p50, p95, jitterMs } = this.regionProfile;
    const u1 = Math.max(0.0001, this.rng.next());
    const u2 = Math.max(0.0001, this.rng.next());
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const base = p50 + z * ((p95 - p50) / 1.645);
    return Math.max(0, Math.round(base + (this.rng.next() - 0.5) * jitterMs));
  }

  private selectTransition(node: BehaviorNode, result: HttpResult | null): string | null {
    if (!node.transitions.length) return null;

    const valid = node.transitions.filter((t) => {
      if (!t.guard) return true;
      switch (t.guard.type) {
        case 'response_status':
          return result?.statusCode === t.guard.value;
        case 'retry_count':
          return this.state.retryCount <= (t.guard.value as number);
        case 'history_contains':
          return this.state.historyRing.includes(t.guard.value as string);
        default:
          return true;
      }
    });

    if (!valid.length) return null;

    const total = valid.reduce((s, t) => s + t.weight, 0);
    let roll = this.rng.next() * total;
    for (const t of valid) {
      roll -= t.weight;
      if (roll <= 0) return t.targetNodeId === '__exit__' ? null : t.targetNodeId;
    }
    return null;
  }

  private isLooping(): boolean {
    return (
      this.state.historyRing.filter((id) => id === this.state.currentNodeId).length >=
      LOOP_THRESHOLD
    );
  }

  private pushHistory(nodeId: string): void {
    this.state.historyRing.push(nodeId);
    if (this.state.historyRing.length > MAX_HISTORY) this.state.historyRing.shift();
  }

  private sampleThinkTime(node: BehaviorNode): number {
    const { meanMs, stdDevMs } = node.thinkTimeMs;
    if (!meanMs) return 0;
    const u1 = this.rng.next();
    const u2 = this.rng.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(0, Math.round(meanMs + z * stdDevMs));
  }

  private async fail(reason: string): Promise<void> {
    this.state.status = AgentStatus.FAILED;
    await this.emit(SimForgeEventType.AGENT_FAILED, {
      agentId: this.state.agentId,
      reason,
      nodeId: this.state.currentNodeId,
      regionCode: this.regionProfile?.regionCode ?? null,
      countryCode: this.regionProfile?.countryCode ?? null,
    });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
