import { Injectable } from '@nestjs/common';
import { getDb } from '../../db/database';

export interface ShardMetricsDto {
  runId: string;
  shardId: string;
  totalRequests: number;
  totalErrors: number;
  totalAgents: number;
  completedAgents: number;
  failedAgents: number;
  durationMs: number;
  peakRps: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  regionBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  errorSamples: { error: string; count: number; regionCode?: string }[];
  latencyHistogram: { bucket: number; count: number }[];
  startedAt?: string;
  completedAt?: string;
}

@Injectable()
export class MetricsService {
  private readonly sql = getDb();

  async upsertShardMetrics(dto: ShardMetricsDto): Promise<void> {
    await this.sql`
      INSERT INTO run_metrics (
        run_id, shard_id,
        total_requests, total_errors,
        total_agents, completed_agents, failed_agents,
        duration_ms, peak_rps,
        p50_ms, p95_ms, p99_ms,
        region_breakdown, country_breakdown,
        status_breakdown, error_samples, latency_histogram,
        started_at, completed_at
      ) VALUES (
        ${dto.runId}, ${dto.shardId},
        ${dto.totalRequests}, ${dto.totalErrors},
        ${dto.totalAgents}, ${dto.completedAgents}, ${dto.failedAgents},
        ${dto.durationMs}, ${dto.peakRps},
        ${dto.p50Ms}, ${dto.p95Ms}, ${dto.p99Ms},
        ${this.sql.json(dto.regionBreakdown)},
        ${this.sql.json(dto.countryBreakdown)},
        ${this.sql.json(dto.statusBreakdown)},
        ${this.sql.json(dto.errorSamples)},
        ${this.sql.json(dto.latencyHistogram)},
        ${dto.startedAt ?? null},
        ${dto.completedAt ?? null}
      )
      ON CONFLICT (run_id, shard_id) DO UPDATE SET
        total_requests    = EXCLUDED.total_requests,
        total_errors      = EXCLUDED.total_errors,
        completed_agents  = EXCLUDED.completed_agents,
        failed_agents     = EXCLUDED.failed_agents,
        duration_ms       = EXCLUDED.duration_ms,
        peak_rps          = EXCLUDED.peak_rps,
        p50_ms            = EXCLUDED.p50_ms,
        p95_ms            = EXCLUDED.p95_ms,
        p99_ms            = EXCLUDED.p99_ms,
        region_breakdown  = EXCLUDED.region_breakdown,
        country_breakdown = EXCLUDED.country_breakdown,
        status_breakdown  = EXCLUDED.status_breakdown,
        error_samples     = EXCLUDED.error_samples,
        latency_histogram = EXCLUDED.latency_histogram,
        completed_at      = EXCLUDED.completed_at
    `;
  }

  async getRunMetrics(runId: string) {
    const rows = await this.sql`
      SELECT * FROM run_metrics WHERE run_id = ${runId}
    `;

    if (rows.length === 0) return null;

    // Aggregate across shards
    const totalRequests = rows.reduce((s, r) => s + Number(r.totalRequests), 0);
    const totalErrors = rows.reduce((s, r) => s + Number(r.totalErrors), 0);
    const totalAgents = rows.reduce((s, r) => s + Number(r.totalAgents), 0);
    const completedAgents = rows.reduce(
      (s, r) => s + Number(r.completedAgents),
      0,
    );
    const failedAgents = rows.reduce((s, r) => s + Number(r.failedAgents), 0);
    const durationMs = Math.max(...rows.map((r) => Number(r.durationMs)));
    const peakRps = rows.reduce((s, r) => s + Number(r.peakRps), 0);

    // Weighted latency percentiles
    const p50Ms = Math.round(
      rows.reduce((s, r) => s + Number(r.p50Ms), 0) / rows.length,
    );
    const p95Ms = Math.round(
      rows.reduce((s, r) => s + Number(r.p95Ms), 0) / rows.length,
    );
    const p99Ms = Math.round(
      rows.reduce((s, r) => s + Number(r.p99Ms), 0) / rows.length,
    );

    // Merge region breakdown
    const regionBreakdown: Record<string, number> = {};
    rows.forEach((r) => {
      Object.entries(r.regionBreakdown as Record<string, number>).forEach(
        ([k, v]) => {
          regionBreakdown[k] = (regionBreakdown[k] ?? 0) + v;
        },
      );
    });

    // Merge country breakdown
    const countryBreakdown: Record<string, number> = {};
    rows.forEach((r) => {
      Object.entries(r.countryBreakdown as Record<string, number>).forEach(
        ([k, v]) => {
          countryBreakdown[k] = (countryBreakdown[k] ?? 0) + v;
        },
      );
    });

    // Merge status breakdown
    const statusBreakdown: Record<string, number> = {};
    rows.forEach((r) => {
      Object.entries(r.statusBreakdown as Record<string, number>).forEach(
        ([k, v]) => {
          statusBreakdown[k] = (statusBreakdown[k] ?? 0) + v;
        },
      );
    });

    // Collect error samples across shards
    const errorSamples = rows.flatMap(
      (r) => r.errorSamples as { error: string; count: number }[],
    );

    const startedAt =
      rows
        .map((r) => r.startedAt)
        .filter(Boolean)
        .sort()[0] ?? null;
    const completedAt =
      rows
        .map((r) => r.completedAt)
        .filter(Boolean)
        .sort()
        .reverse()[0] ?? null;

    return {
      runId,
      shards: rows.length,
      totalRequests,
      totalErrors,
      totalAgents,
      completedAgents,
      failedAgents,
      durationMs,
      peakRps,
      p50Ms,
      p95Ms,
      p99Ms,
      successRate:
        totalRequests > 0
          ? ((totalRequests - totalErrors) / totalRequests) * 100
          : 0,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      regionBreakdown,
      countryBreakdown,
      statusBreakdown,
      errorSamples,
      startedAt,
      completedAt,
    };
  }

  async listRunMetricsSummaries(scenarioId: string) {
    return this.sql`
      SELECT
        r.id as run_id,
        r.created_at,
        r.status,
        COALESCE(SUM(m.total_requests), 0) as total_requests,
        COALESCE(SUM(m.total_errors), 0) as total_errors,
        COALESCE(MAX(m.peak_rps), 0) as peak_rps,
        COALESCE(AVG(m.p95_ms), 0) as avg_p95_ms,
        MIN(m.started_at) as started_at,
        MAX(m.completed_at) as completed_at
      FROM simulation_runs r
      LEFT JOIN run_metrics m ON m.run_id = r.id
      WHERE r.scenario_id = ${scenarioId}
      GROUP BY r.id, r.created_at, r.status
      ORDER BY r.created_at DESC
      LIMIT 20
    `;
  }
}
