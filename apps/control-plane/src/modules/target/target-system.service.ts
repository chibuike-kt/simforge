import { Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';

import { SimulationMode, TargetSystemProfile } from '@simforge/shared';

import { getDb } from '../../db/database';

const CreateTargetSchema = z.object({
  name: z.string().min(1).max(100),
  allowedOrigins: z.array(z.string().url()).min(1).max(20),
  maxRps: z.number().int().min(1).max(100_000).default(100),
  maxConcurrency: z.number().int().min(1).max(10_000_000).default(1000),
  mode: z.nativeEnum(SimulationMode).default(SimulationMode.SANDBOX),
  approvalThreshold: z.number().int().min(0).default(10_000),
  rateLimitFeedbackEnabled: z.boolean().default(true),
});

export type CreateTargetDto = z.infer<typeof CreateTargetSchema>;

@Injectable()
export class TargetSystemService {
  private readonly sql = getDb();

  async create(
    dto: CreateTargetDto,
    createdBy: string,
  ): Promise<TargetSystemProfile> {
    const data = CreateTargetSchema.parse(dto);
    const [row] = await this.sql<TargetSystemProfile[]>`
      INSERT INTO target_system_profiles (
        name, allowed_origins, max_rps, max_concurrency,
        mode, approval_threshold, rate_limit_feedback_enabled, created_by
      ) VALUES (
        ${data.name}, ${this.sql.array(data.allowedOrigins)}, ${data.maxRps},
        ${data.maxConcurrency}, ${data.mode}, ${data.approvalThreshold},
        ${data.rateLimitFeedbackEnabled}, ${createdBy}
      ) RETURNING *
    `;
    return row;
  }

  async findAll(): Promise<TargetSystemProfile[]> {
    return this.sql<TargetSystemProfile[]>`
      SELECT * FROM target_system_profiles ORDER BY created_at DESC
    `;
  }

  async findById(id: string): Promise<TargetSystemProfile> {
    const [row] = await this.sql<TargetSystemProfile[]>`
      SELECT * FROM target_system_profiles WHERE id = ${id}
    `;
    if (!row) throw new NotFoundException(`Target system ${id} not found`);
    return row;
  }

  async markVerified(id: string): Promise<TargetSystemProfile> {
    const [row] = await this.sql<TargetSystemProfile[]>`
      UPDATE target_system_profiles
      SET verified_at = NOW(), updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    if (!row) throw new NotFoundException(`Target system ${id} not found`);
    return row;
  }

  validateOrigin(
    target: TargetSystemProfile,
    url: string,
  ): { allowed: boolean; reason?: string } {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return { allowed: false, reason: `Invalid URL: ${url}` };
    }

    const allowed = target.allowedOrigins.some((o) => {
      if (o === parsed.origin) return true;
      if (o.startsWith('*.')) return parsed.hostname.endsWith(o.slice(2));
      return false;
    });

    return allowed
      ? { allowed: true }
      : { allowed: false, reason: `Origin ${parsed.origin} not in allowlist` };
  }

  requiresApproval(target: TargetSystemProfile, agentCount: number): boolean {
    return agentCount >= target.approvalThreshold;
  }
}
