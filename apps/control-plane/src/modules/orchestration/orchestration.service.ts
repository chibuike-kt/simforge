import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import {
  RunStatus,
  SimulationJobEnvelope,
  TrafficPattern,
  TrafficPatternConfig,
} from '@simforge/shared';

import { getDb } from '../../db/database';
import { getJobQueue } from '../../db/redis';
import { signJobEnvelope } from '../../common/job-signing.service';
import { TargetSystemService } from '../target/target-system.service';
import { BehaviorModelService } from '../behavior/behavior-model.service';

const SHARD_SIZE = 500;

@Injectable()
export class OrchestrationService {
  private readonly sql = getDb();
  private readonly targetService = new TargetSystemService();
  private readonly behaviorService = new BehaviorModelService();

  async dispatch(runId: string): Promise<void> {
    const [run] = await this.sql`
      SELECT * FROM simulation_runs WHERE id = ${runId}
    `;
    if (!run) throw new BadRequestException(`Run ${runId} not found`);
    if (run.status !== RunStatus.APPROVED) {
      throw new BadRequestException(
        `Run ${runId} is not approved (status: ${run.status})`,
      );
    }

    const [scenario] = await this.sql`
      SELECT * FROM simulation_scenarios WHERE id = ${run.scenarioId}
    `;
    if (!scenario) throw new BadRequestException(`Scenario not found`);

    const target = await this.targetService.findById(scenario.targetSystemId);
    const behaviorRaw = await this.behaviorService.findById(
      scenario.behaviorModelId,
    );
    if (!behaviorRaw) throw new BadRequestException(`Behavior model not found`);

    // stateGraph is JSONB — may come back as object or string
    const stateGraph =
      typeof behaviorRaw.stateGraph === 'string'
        ? JSON.parse(behaviorRaw.stateGraph)
        : behaviorRaw.stateGraph;

    const behaviorModel = {
      id: behaviorRaw.id,
      version: behaviorRaw.version,
      name: behaviorRaw.name,
      entryNodeId: stateGraph.entryNodeId ?? behaviorRaw.entryNodeId,
      nodes: stateGraph.nodes ?? stateGraph,
    };

    const totalAgents = this.computeMaxAgents(
      scenario.trafficPattern as TrafficPatternConfig,
    );
    const shards = this.buildShards(totalAgents);
    const queue = getJobQueue();
    const dispatchedAt = new Date().toISOString();
    const workerAssignment: Record<string, string[]> = {};

    for (const shard of shards) {
      const envelope: Omit<SimulationJobEnvelope, 'signature'> = {
        runId,
        shardId: shard.id,
        agentCount: shard.agentCount,
        agentIdRange: [shard.startId, shard.endId],
        behaviorModel,
        targetConfig: {
          baseUrl: target.allowedOrigins[0],
          allowedOrigins: target.allowedOrigins,
          maxRps: Math.floor(target.maxRps / shards.length),
          mode: target.mode,
        },
        timingConfig: {
          startOffsetMs: this.staggerOffset(shard.index, shards.length),
          rampCurve: scenario.trafficPattern as TrafficPatternConfig,
        },
        signedAt: dispatchedAt,
      };

      const signed = signJobEnvelope(envelope);

      await queue.add(`sim-${runId}-${shard.id}`, signed, {
        jobId: `${runId}-${shard.id}`,
        delay: shard.index * 100,
        priority: 1,
      });

      workerAssignment[shard.id] = [];
    }

    await this.sql`
      UPDATE simulation_runs
      SET
        status = ${RunStatus.DISPATCHED},
        worker_assignment = ${this.sql.json(workerAssignment)},
        audit_trail = array_append(audit_trail, ${this.sql.json({
          event: 'dispatched',
          shardCount: shards.length,
          totalAgents,
          at: dispatchedAt,
        })}::jsonb)
      WHERE id = ${runId}
    `;

    console.log(
      `[Orchestration] Run ${runId} dispatched — ${shards.length} shards, ${totalAgents} agents`,
    );
  }

  private computeMaxAgents(pattern: TrafficPatternConfig): number {
    switch (pattern.type) {
      case TrafficPattern.STEADY:
        return pattern.steadyAgents ?? 1000;
      case TrafficPattern.RAMP:
        return pattern.endAgents ?? 1000;
      case TrafficPattern.BURST:
        return pattern.burstAgents ?? 1000;
      case TrafficPattern.VIRAL:
        return pattern.endAgents ?? 10_000;
      case TrafficPattern.STEP:
        return Math.max(...(pattern.steps?.map((s) => s.agents) ?? [1000]));
      default:
        return 1000;
    }
  }

  private buildShards(totalAgents: number) {
    const count = Math.ceil(totalAgents / SHARD_SIZE);
    return Array.from({ length: count }, (_, i) => ({
      id: `shard-${String(i).padStart(4, '0')}`,
      index: i,
      agentCount: i === count - 1 ? totalAgents - i * SHARD_SIZE : SHARD_SIZE,
      startId: randomUUID(),
      endId: randomUUID(),
    }));
  }

  private staggerOffset(index: number, total: number): number {
    const base = (index / total) * 30_000;
    const jitter = base * 0.1 * (Math.random() * 2 - 1);
    return Math.floor(base + jitter);
  }
}
