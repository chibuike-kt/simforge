import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { RunStatus } from '@simforge/shared';

import { getDb } from '../../db/database';
import { OrchestrationService } from '../orchestration/orchestration.service';

@Injectable()
export class ApprovalService {
  private readonly sql = getDb();
  private readonly orchestration = new OrchestrationService();

  async findPendingRuns() {
    return this.sql`
      SELECT r.*, s.name as scenario_name
      FROM simulation_runs r
      JOIN simulation_scenarios s ON s.id = r.scenario_id
      WHERE r.status = ${RunStatus.PENDING}
      ORDER BY r.created_at ASC
    `;
  }

  async approve(runId: string, approvedBy: string) {
    const [run] = await this.sql`
      UPDATE simulation_runs
      SET
        status = ${RunStatus.APPROVED},
        approved_by = ${approvedBy},
        approved_at = NOW(),
        audit_trail = array_append(audit_trail, ${this.sql.json({
          event: 'approved',
          by: approvedBy,
          at: new Date().toISOString(),
        })}::jsonb)
      WHERE id = ${runId} AND status = ${RunStatus.PENDING}
      RETURNING *
    `;
    if (!run)
      throw new BadRequestException(`Run ${runId} not found or not pending`);

    await this.orchestration.dispatch(runId);
    return run;
  }

  async reject(runId: string, rejectedBy: string, reason: string) {
    const [run] = await this.sql`
      UPDATE simulation_runs
      SET
        status = ${RunStatus.CANCELLED},
        audit_trail = array_append(audit_trail, ${this.sql.json({
          event: 'rejected',
          by: rejectedBy,
          reason,
          at: new Date().toISOString(),
        })}::jsonb)
      WHERE id = ${runId} AND status = ${RunStatus.PENDING}
      RETURNING *
    `;
    if (!run)
      throw new NotFoundException(`Run ${runId} not found or not pending`);
    return run;
  }
}
