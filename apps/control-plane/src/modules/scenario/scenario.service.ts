import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { z } from 'zod';

import { ScenarioStatus, TrafficPattern, RunStatus } from '@simforge/shared';

import { getDb } from '../../db/database';
import { TargetSystemService } from '../target/target-system.service';

const CreateScenarioSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  targetSystemId: z.string().uuid(),
  behaviorModelId: z.string().uuid(),
  trafficPattern: z.object({
    type: z.nativeEnum(TrafficPattern),
    startAgents: z.number().int().positive().optional(),
    endAgents: z.number().int().positive().optional(),
    durationMs: z.number().int().positive().optional(),
    burstAgents: z.number().int().positive().optional(),
    burstDurationMs: z.number().int().positive().optional(),
    growthFactor: z.number().positive().optional(),
    steadyAgents: z.number().int().positive().optional(),
    steps: z
      .array(
        z.object({
          agents: z.number().int().positive(),
          durationMs: z.number().int().positive(),
        }),
      )
      .optional(),
  }),
  geographicDistribution: z.record(z.number()).optional(),
});

export type CreateScenarioDto = z.infer<typeof CreateScenarioSchema>;

@Injectable()
export class ScenarioService {
  private readonly sql = getDb();
  private readonly targetService = new TargetSystemService();

  async create(dto: CreateScenarioDto, createdBy: string) {
    const data = CreateScenarioSchema.parse(dto);
    await this.targetService.findById(data.targetSystemId);

    const [row] = await this.sql`
      INSERT INTO simulation_scenarios (
        name, description, target_system_id, behavior_model_id,
        traffic_pattern, geographic_distribution, created_by
      ) VALUES (
        ${data.name}, ${data.description ?? null}, ${data.targetSystemId},
        ${data.behaviorModelId}, ${this.sql.json(data.trafficPattern)},
        ${this.sql.json(data.geographicDistribution ?? {})}, ${createdBy}
      ) RETURNING *
    `;
    return row;
  }

  async findAll() {
    return this
      .sql`SELECT * FROM simulation_scenarios ORDER BY created_at DESC`;
  }

  async findById(id: string) {
    const [row] = await this
      .sql`SELECT * FROM simulation_scenarios WHERE id = ${id}`;
    if (!row) throw new NotFoundException(`Scenario ${id} not found`);
    return row;
  }

  async publish(id: string) {
    const [row] = await this.sql`
      UPDATE simulation_scenarios
      SET status = ${ScenarioStatus.PUBLISHED}, updated_at = NOW()
      WHERE id = ${id} AND status = ${ScenarioStatus.DRAFT}
      RETURNING *
    `;
    if (!row)
      throw new BadRequestException(
        `Scenario ${id} not found or not in draft status`,
      );
    return row;
  }

  async submitRun(
    scenarioId: string,
    submittedBy: string,
    agentCount?: number,
    flowSteps?: Record<string, unknown>,
    entryNodeId?: string,
    baseUrl?: string,
  ) {
    const scenario = await this.findById(scenarioId);
    if (scenario.status !== ScenarioStatus.PUBLISHED) {
      throw new BadRequestException(
        `Scenario must be published before submitting a run`,
      );
    }

    const target = await this.targetService.findById(scenario.targetSystemId);

    const trafficPattern = agentCount
      ? {
          ...scenario.trafficPattern,
          steadyAgents: agentCount,
          endAgents: agentCount,
          burstAgents: agentCount,
        }
      : scenario.trafficPattern;

    const [run] = await this.sql`
    INSERT INTO simulation_runs (scenario_id, scenario_version, status, audit_trail)
    VALUES (
      ${scenarioId}, ${scenario.version}, ${RunStatus.PENDING},
      ${this.sql.array([
        this.sql.json({
          event: 'submitted',
          by: submittedBy,
          agentCount: agentCount ?? null,
          at: new Date().toISOString(),
        }),
      ])}
    ) RETURNING *
  `;

    const requiresApproval = this.targetService.requiresApproval(
      target,
      agentCount ?? 1000,
    );
    if (!requiresApproval) {
      await this.sql`
      UPDATE simulation_runs
      SET status = ${RunStatus.APPROVED}, approved_at = NOW()
      WHERE id = ${run.id}
    `;
      const { OrchestrationService } =
        await import('../orchestration/orchestration.service');
      const orchestration = new OrchestrationService();
      await orchestration.dispatch(
        run.id,
        trafficPattern,
        flowSteps,
        entryNodeId,
        baseUrl,
      );
    }

    return run;
  }

  async findRuns(scenarioId: string) {
    return this.sql`
      SELECT * FROM simulation_runs
      WHERE scenario_id = ${scenarioId}
      ORDER BY created_at DESC
    `;
  }
}
