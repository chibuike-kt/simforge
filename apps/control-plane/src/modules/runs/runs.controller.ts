import { Controller, Param, Patch, Body } from '@nestjs/common';
import { getDb } from '../../db/database';

@Controller('api/runs')
export class RunsController {
  private readonly sql = getDb();

  @Patch(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body() body: { completedAt?: string },
  ) {
    await this.sql`
      UPDATE simulation_runs
      SET
        status = 'completed',
        audit_trail = array_append(audit_trail, ${this.sql.json({
          event: 'completed',
          at: body.completedAt ?? new Date().toISOString(),
        })}::jsonb)
      WHERE id = ${id}
        AND status NOT IN ('failed', 'cancelled')
    `;
    return { updated: true };
  }
}
