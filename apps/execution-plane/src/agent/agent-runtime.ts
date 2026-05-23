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

import { HttpAdapter } from '../adapters/http/http.adapter';
import { TokenBucket } from '../worker/token-bucket';
import { SeededRandom } from './seeded-random';
import { RegionProfile, applyRegionProfile } from './region-profile';

const MAX_STEPS = 10_000;
const MAX_HISTORY = 8;
const LOOP_THRESHOLD = 5;

export type EventEmitter = (type: SimForgeEventType, payload: object) => Promise<void>;

// ─── Model normalizer ─────────────────────────────────────────────────────────
// BullMQ serializes through Redis JSON — JSONB fields may arrive as strings,
// and the behavior model structure varies depending on how it was built.
function normalizeModel(raw: BehaviorModel): BehaviorModel {
  const any = raw as unknown as Record<string, unknown>;

  // Try to get nodes from various locations
  let nodes = raw.nodes;
  let entryNodeId = raw.entryNodeId;

  // nodes is a JSON string
  if (typeof nodes === 'string') {
    try {
      nodes = JSON.parse(nodes as unknown as string);
    } catch {
      nodes = undefined as unknown as BehaviorModel['nodes'];
    }
  }

  // nodes missing — try stateGraph
  if (!nodes && any.stateGraph) {
    const sg =
      typeof any.stateGraph === 'string'
        ? JSON.parse(any.stateGraph as string)
        : (any.stateGraph as Record<string, unknown>);
    nodes = (sg?.nodes ?? sg) as BehaviorModel['nodes'];
    if (!entryNodeId && sg?.entryNodeId) entryNodeId = sg.entryNodeId as string;
  }

  // nodes is still a string after stateGraph extraction
  if (typeof nodes === 'string') {
    try {
      nodes = JSON.parse(nodes as unknown as string);
    } catch {
      nodes = undefined as unknown as BehaviorModel['nodes'];
    }
  }

  // Last resort — check if the model itself is the stateGraph
  if (!nodes && any.nodes === undefined) {
    const keys = Object.keys(any);
    const likelyNodes = keys.every((k) => typeof any[k] === 'object');
    if (likelyNodes && keys.length > 0) {
      nodes = any as unknown as BehaviorModel['nodes'];
    }
  }

  if (!nodes || typeof nodes !== 'object') {
    console.error(
      '[normalizeModel] Failed to resolve nodes.',
      'raw keys:',
      Object.keys(any),
      'nodes type:',
      typeof nodes,
      'stateGraph type:',
      typeof any.stateGraph,
    );
  }

  return {
    ...raw,
    nodes: nodes ?? ({} as BehaviorModel['nodes']),
    entryNodeId: entryNodeId ?? raw.entryNodeId,
  };
}

// ─── AgentRuntime ─────────────────────────────────────────────────────────────

export class AgentRuntime {
  private readonly model: BehaviorModel;
  private readonly state: AgentState;
  private readonly rng: SeededRandom;

  constructor(
    model: BehaviorModel,
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
    this.model = normalizeModel(model);

    this.state = {
      agentId: randomUUID(),
      runId,
      shardId,
      currentNodeId: this.model.entryNodeId,
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
    try {
      await this.emit(SimForgeEventType.AGENT_SPAWNED, {
        agentId: this.state.agentId,
        runId: this.runId,
        behaviorModelId: this.model.id,
        entryNodeId: this.model.entryNodeId,
        regionCode: this.regionProfile?.regionCode ?? null,
        countryCode: this.regionProfile?.countryCode ?? null,
        label: this.regionProfile?.label ?? null,
      });

      this.state.status = AgentStatus.ACTIVE;
      let steps = 0;

      // Validate
      if (
        !this.model.nodes ||
        typeof this.model.nodes !== 'object' ||
        Object.keys(this.model.nodes).length === 0
      ) {
        console.error(`[AgentRuntime] No valid nodes for agent ${this.state.agentId}`);
        return this.fail('invalid_model_nodes');
      }

      if (!this.model.entryNodeId) {
        return this.fail('missing_entry_node_id');
      }

      const entryNode = this.model.nodes[this.model.entryNodeId];
      if (!entryNode) {
        console.error(
          `[AgentRuntime] Entry node "${this.model.entryNodeId}" not found. Available:`,
          Object.keys(this.model.nodes),
        );
        return this.fail(`entry_node_not_found:${this.model.entryNodeId}`);
      }

      while (this.state.status === AgentStatus.ACTIVE) {
        if (++steps > MAX_STEPS) return this.fail('max_steps_exceeded');

        const node = this.model.nodes[this.state.currentNodeId];
        if (!node) return this.fail(`node_not_found:${this.state.currentNodeId}`);

        if (node.type === 'abort') {
          this.state.status = AgentStatus.COMPLETED;
          await this.emit(SimForgeEventType.AGENT_COMPLETED, {
            agentId: this.state.agentId,
            runId: this.runId,
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
            runId: this.runId,
            nodeId: this.state.currentNodeId,
            regionCode: this.regionProfile?.regionCode ?? null,
          });
          return;
        }

        const now = Date.now();
        if (this.state.cooldownUntil > now) await sleep(this.state.cooldownUntil - now);

        const think = this.sampleThinkTime(node);
        const regionJitter = this.regionProfile
          ? Math.round(this.rng.next() * this.regionProfile.jitterMs)
          : 0;
        if (think + regionJitter > 0) await sleep(think + regionJitter);

        let result: {
          statusCode: number;
          latencyMs: number;
          bodyHash: string | null;
          bodyRaw: string | null;
          error: string | null;
        } | null = null;

        if (node.type === 'http' && node.action) {
          result = await this.executeHttp(node, node.action as HttpAction, steps);
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
            runId: this.runId,
            steps,
            regionCode: this.regionProfile?.regionCode ?? null,
            countryCode: this.regionProfile?.countryCode ?? null,
          });
          return;
        }

        await this.emit(SimForgeEventType.AGENT_STATE_CHANGED, {
          agentId: this.state.agentId,
          runId: this.runId,
          fromNodeId: this.state.currentNodeId,
          toNodeId: nextId,
          regionCode: this.regionProfile?.regionCode ?? null,
        });

        this.pushHistory(this.state.currentNodeId);
        this.state.currentNodeId = nextId;
        this.state.retryCount = 0;
        this.state.lastActiveAt = new Date().toISOString();
      }
    } catch (err) {
      console.error(
        `[AgentRuntime] Uncaught error in agent ${this.state.agentId}:`,
        err instanceof Error ? err.message : err,
        err instanceof Error ? err.stack?.split('\n').slice(1, 3).join(' | ') : '',
      );
      return this.fail(`uncaught:${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async executeHttp(node: BehaviorNode, action: HttpAction, stepIndex: number) {
    await this.emit(SimForgeEventType.ACTION_EXECUTED, {
      agentId: this.state.agentId,
      runId: this.runId,
      nodeId: node.id,
      method: action.method,
      regionCode: this.regionProfile?.regionCode ?? null,
      countryCode: this.regionProfile?.countryCode ?? null,
    });

    const regionHeaders = this.regionProfile
      ? applyRegionProfile(this.regionProfile, this.rng)
      : {};

    const nodeExtra = node as unknown as Record<string, unknown>;
    const extractRules = nodeExtra.extractRules as Record<string, string> | undefined;

    const result = await this.http.execute(
      { ...action, headers: { ...action.headers, ...regionHeaders } },
      {
        sessionToken: this.state.sessionToken,
        agentId: this.state.agentId,
        regionCode: this.regionProfile?.regionCode,
        countryCode: this.regionProfile?.countryCode,
        rng: this.rng,
        stepIndex,
        extractRules,
        customKv: this.state.customKv as Record<string, unknown>,
      },
    );

    const packetLost = this.regionProfile && this.rng.next() < this.regionProfile.packetLossRate;

    if (result.error || packetLost) {
      this.state.retryCount++;
      const shouldRetry = !this.regionProfile || this.rng.next() < this.regionProfile.retryRate;

      if (this.state.retryCount > node.maxRetries || !shouldRetry) {
        await this.emit(SimForgeEventType.ACTION_DLQ_SENT, {
          agentId: this.state.agentId,
          runId: this.runId,
          nodeId: node.id,
          error: packetLost ? 'packet_loss' : result.error,
          regionCode: this.regionProfile?.regionCode ?? null,
          countryCode: this.regionProfile?.countryCode ?? null,
        });
      } else {
        await this.emit(SimForgeEventType.ACTION_RETRIED, {
          agentId: this.state.agentId,
          runId: this.runId,
          nodeId: node.id,
          retryCount: this.state.retryCount,
          regionCode: this.regionProfile?.regionCode ?? null,
        });
      }
    } else {
      const regionLatency = this.regionProfile ? this.sampleRegionLatency() : 0;
      await this.emit(SimForgeEventType.RESPONSE_RECEIVED, {
        agentId: this.state.agentId,
        runId: this.runId,
        statusCode: result.statusCode,
        latencyMs: result.latencyMs + regionLatency,
        actualLatencyMs: result.latencyMs,
        regionLatencyMs: regionLatency,
        nodeId: node.id,
        bodyHash: result.bodyHash,
        bodyRaw: result.bodyRaw,
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

  private selectTransition(
    node: BehaviorNode,
    result: { statusCode: number } | null,
  ): string | null {
    if (!node.transitions?.length) return null;

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
    const u1 = Math.max(0.0001, this.rng.next());
    const u2 = Math.max(0.0001, this.rng.next());
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(0, Math.round(meanMs + z * stdDevMs));
  }

  private async fail(reason: string): Promise<void> {
    this.state.status = AgentStatus.FAILED;
    await this.emit(SimForgeEventType.AGENT_FAILED, {
      agentId: this.state.agentId,
      runId: this.runId,
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
