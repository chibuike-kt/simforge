import { Injectable, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { z } from 'zod';

import { BehaviorModel, BehaviorNode } from '@simforge/shared';

import { getDb } from '../../db/database';

const TransitionSchema = z.object({
  targetNodeId: z.string(),
  weight: z.number().min(0).max(1),
  guard: z
    .object({
      type: z.enum(['response_status', 'retry_count', 'history_contains']),
      value: z.union([z.string(), z.number()]),
    })
    .nullable(),
});

const NodeSchema = z.object({
  id: z.string(),
  type: z.enum(['http', 'websocket', 'wait', 'branch', 'abort']),
  label: z.string(),
  action: z.unknown().nullable(),
  transitions: z.array(TransitionSchema),
  cooldownMs: z.number().min(0).default(0),
  thinkTimeMs: z.object({ meanMs: z.number(), stdDevMs: z.number() }),
  maxRetries: z.number().int().min(0).max(10).default(3),
});

const CreateBehaviorModelSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  entryNodeId: z.string(),
  nodes: z.record(NodeSchema),
});

export type CreateBehaviorModelDto = z.infer<typeof CreateBehaviorModelSchema>;

@Injectable()
export class BehaviorModelService {
  private readonly sql = getDb();

  async create(
    dto: CreateBehaviorModelDto,
    createdBy: string,
  ): Promise<BehaviorModel> {
    const data = CreateBehaviorModelSchema.parse(dto);
    const errors = this.validateGraph(
      data.entryNodeId,
      data.nodes as Record<string, BehaviorNode>,
    );
    if (errors.length) throw new BadRequestException(errors.join('; '));

    const compiledHash = createHash('sha256')
      .update(JSON.stringify(data, Object.keys(data).sort()))
      .digest('hex');

    const [row] = await this.sql`
      INSERT INTO behavior_models (
        name, description, entry_node_id, state_graph, compiled_hash, created_by
      ) VALUES (
        ${data.name}, ${data.description ?? null}, ${data.entryNodeId},
        ${this.sql.json(data.nodes)}, ${compiledHash}, ${createdBy}
      ) RETURNING *
    `;

    return this.toModel(row);
  }

  async findById(id: string): Promise<BehaviorModel | null> {
    const [row] = await this
      .sql`SELECT * FROM behavior_models WHERE id = ${id}`;
    return row ? this.toModel(row) : null;
  }

  async findAll(): Promise<BehaviorModel[]> {
    const rows = await this
      .sql`SELECT * FROM behavior_models ORDER BY created_at DESC`;
    return rows.map((r) => this.toModel(r));
  }

  private validateGraph(
    entryNodeId: string,
    nodes: Record<string, BehaviorNode>,
  ): string[] {
    const errors: string[] = [];
    const ids = new Set(Object.keys(nodes));

    if (!ids.has(entryNodeId)) {
      errors.push(`Entry node "${entryNodeId}" not found in graph`);
    }

    for (const [id, node] of Object.entries(nodes)) {
      const hasGuards = node.transitions.some((t) => t.guard !== null);
      if (!hasGuards && node.transitions.length > 0) {
        const total = node.transitions.reduce((s, t) => s + t.weight, 0);
        if (Math.abs(total - 1.0) > 0.001) {
          errors.push(
            `Node "${id}" transition weights sum to ${total.toFixed(3)}, expected 1.0`,
          );
        }
      }
      for (const t of node.transitions) {
        if (t.targetNodeId !== '__exit__' && !ids.has(t.targetNodeId)) {
          errors.push(
            `Node "${id}" references unknown node "${t.targetNodeId}"`,
          );
        }
      }
      if (node.type !== 'abort' && node.transitions.length === 0) {
        errors.push(`Node "${id}" has no transitions and is not an abort node`);
      }
    }

    return errors;
  }

  private toModel(row: Record<string, unknown>): BehaviorModel {
    return {
      id: row.id as string,
      version: row.version as number,
      name: row.name as string,
      entryNodeId: row.entryNodeId as string,
      nodes: row.stateGraph as Record<string, BehaviorNode>,
      compiledHash: row.compiledHash as string,
    };
  }
}
