import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { z } from 'zod';

import { SimulationJobEnvelope, SimForgeEventType } from '@simforge/shared';

import { HttpAdapter } from '../adapters/http/http.adapter';
import { AgentRuntime } from '../agent/agent-runtime';
import { SeededRandom } from '../agent/seeded-random';
import { TokenBucket } from './token-bucket';
import { verifyJobEnvelope } from '../security/job-verification';
import { pickRegionProfile } from '../agent/region-profile';

// ─── Env ──────────────────────────────────────────────────────────────────────

const env = z
  .object({
    REDIS_URL: z.string().url(),
    WORKER_ID: z.string().default(`worker-${process.pid}`),
    WORKER_REGION: z.string().default('local'),
    JOB_SIGNING_SECRET: z.string().min(32),
    MAX_CONCURRENT_AGENTS: z.coerce.number().default(1000),
    WORKER_CONCURRENCY: z.coerce.number().default(10),
    GLOBAL_RPS_CAP: z.coerce.number().default(500),
    CIRCUIT_ERROR_RATE_THRESHOLD: z.coerce.number().default(0.8),
    CIRCUIT_WINDOW_MS: z.coerce.number().default(30_000),
    CONTROL_PLANE_URL: z.string().default('http://localhost:4000'),
  })
  .parse(process.env);

const QUEUE = 'sf-simulation-jobs';

// ─── Redis ────────────────────────────────────────────────────────────────────

const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// ─── Circuit Breakers ─────────────────────────────────────────────────────────

interface Circuit {
  errors: number;
  total: number;
  windowStart: number;
  open: boolean;
}

const circuits = new Map<string, Circuit>();

function recordResult(shardId: string, isError: boolean): void {
  if (!circuits.has(shardId)) {
    circuits.set(shardId, { errors: 0, total: 0, windowStart: Date.now(), open: false });
  }
  const c = circuits.get(shardId)!;
  if (Date.now() - c.windowStart > env.CIRCUIT_WINDOW_MS) {
    c.errors = 0;
    c.total = 0;
    c.windowStart = Date.now();
    c.open = false;
  }
  c.total++;
  if (isError) c.errors++;
  if (!c.open && c.total >= 10 && c.errors / c.total >= env.CIRCUIT_ERROR_RATE_THRESHOLD) {
    c.open = true;
    console.error(
      `[Circuit] Shard ${shardId} OPEN — ${((c.errors / c.total) * 100).toFixed(1)}% errors`,
    );
  }
}

// ─── Event Emitter ────────────────────────────────────────────────────────────

async function emit(type: SimForgeEventType, payload: object): Promise<void> {
  const event = {
    eventType: type,
    workerId: env.WORKER_ID,
    occurredAt: new Date().toISOString(),
    ...payload,
  };
  const runId = (payload as Record<string, string>).runId;
  if (runId) {
    await redis.publish(`sf:pubsub:run:${runId}`, JSON.stringify(event));
    await redis.publish(`sf:pubsub:global`, JSON.stringify(event));
  }
  if (env.WORKER_REGION === 'local') {
    console.log(`[Event] ${type}`);
  }
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

interface ShardMetrics {
  totalRequests: number;
  totalErrors: number;
  completedAgents: number;
  failedAgents: number;
  latencies: number[];
  regionBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  errorSamples: { error: string; count: number; regionCode?: string }[];
  rpsWindows: number[];
  startedAt: string;
}

function computePercentile(sorted: number[], pct: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(Math.floor(sorted.length * pct), sorted.length - 1);
  return sorted[idx];
}

function buildHistogram(sorted: number[]): { bucket: number; count: number }[] {
  const buckets = [10, 25, 50, 100, 200, 500, 1000, 2000, 5000];
  const result: { bucket: number; count: number }[] = [];
  let prev = 0;
  for (const bucket of buckets) {
    const count = sorted.filter((v) => v > prev && v <= bucket).length;
    result.push({ bucket, count });
    prev = bucket;
  }
  return result;
}

async function postMetrics(
  metrics: ShardMetrics & {
    runId: string;
    shardId: string;
    totalAgents: number;
    durationMs: number;
  },
): Promise<void> {
  const sorted = [...metrics.latencies].sort((a, b) => a - b);

  const payload = {
    runId: metrics.runId,
    shardId: metrics.shardId,
    totalRequests: metrics.totalRequests,
    totalErrors: metrics.totalErrors,
    totalAgents: metrics.totalAgents,
    completedAgents: metrics.completedAgents,
    failedAgents: metrics.failedAgents,
    durationMs: metrics.durationMs,
    peakRps: metrics.rpsWindows.length > 0 ? Math.max(...metrics.rpsWindows) : 0,
    p50Ms: computePercentile(sorted, 0.5),
    p95Ms: computePercentile(sorted, 0.95),
    p99Ms: computePercentile(sorted, 0.99),
    regionBreakdown: metrics.regionBreakdown,
    countryBreakdown: metrics.countryBreakdown,
    statusBreakdown: metrics.statusBreakdown,
    errorSamples: metrics.errorSamples.slice(0, 20),
    latencyHistogram: buildHistogram(sorted),
    startedAt: metrics.startedAt,
    completedAt: new Date().toISOString(),
  };

  console.log(
    '[Metrics] Posting shard metrics:',
    JSON.stringify({
      runId: payload.runId,
      totalRequests: payload.totalRequests,
      totalErrors: payload.totalErrors,
      completedAgents: payload.completedAgents,
      failedAgents: payload.failedAgents,
      p50Ms: payload.p50Ms,
      p95Ms: payload.p95Ms,
      peakRps: payload.peakRps,
    }),
  );

  try {
    const res = await fetch(`${env.CONTROL_PLANE_URL}/api/metrics/shards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[Metrics] POST failed ${res.status}:`, text);
    } else {
      console.log('[Metrics] Shard metrics posted successfully');
    }
  } catch (err) {
    console.error(
      '[Metrics] Failed to reach control plane:',
      err instanceof Error ? err.message : err,
    );
  }
}

// ─── Job Processor ────────────────────────────────────────────────────────────

async function processJob(job: Job<SimulationJobEnvelope>): Promise<void> {
  const envelope = job.data;
  const { runId, shardId } = envelope;

  console.log(`[Worker:${env.WORKER_ID}] run=${runId} shard=${shardId}`);

  // 1. Verify signature
  const check = verifyJobEnvelope(envelope, env.JOB_SIGNING_SECRET);
  if (!check.valid) {
    throw Object.assign(new Error(`Invalid envelope: ${check.reason}`), { noRetry: true });
  }

  // 2. Idempotency lock
  const lockKey = `sf:shard:lock:${runId}:${shardId}`;
  const acquired = await redis.set(lockKey, env.WORKER_ID, 'EX', 3600, 'NX');
  if (!acquired) {
    console.warn(`[Worker] Shard ${shardId} already executing — skipping`);
    return;
  }

  // 3. Circuit check
  const circuit = circuits.get(shardId);
  if (circuit?.open) {
    await emit(SimForgeEventType.SHARD_FAILED, { runId, shardId, reason: 'circuit_open' });
    return;
  }

  // 4. Staggered start
  if (envelope.timingConfig.startOffsetMs > 0) {
    await sleep(envelope.timingConfig.startOffsetMs);
  }

  // 5. Init metrics accumulator
  const shardMetrics: ShardMetrics = {
    totalRequests: 0,
    totalErrors: 0,
    completedAgents: 0,
    failedAgents: 0,
    latencies: [],
    regionBreakdown: {},
    countryBreakdown: {},
    statusBreakdown: {},
    errorSamples: [],
    rpsWindows: [],
    startedAt: new Date().toISOString(),
  };

  // RPS tracking
  const rpsWindow: number[] = [];
  const rpsInterval = setInterval(() => {
    const now = Date.now();
    const count = rpsWindow.filter((t) => now - t < 1000).length;
    shardMetrics.rpsWindows.push(count);
    // Prune old entries
    let i = 0;
    while (i < rpsWindow.length && now - rpsWindow[i] > 2000) i++;
    rpsWindow.splice(0, i);
  }, 1000);

  await emit(SimForgeEventType.SHARD_STARTED, {
    runId,
    shardId,
    agentCount: envelope.agentCount,
  });

  // 6. Shared shard resources
  const effectiveRps = Math.min(envelope.targetConfig.maxRps, env.GLOBAL_RPS_CAP);
  const rateLimiter = new TokenBucket(effectiveRps);
  const httpAdapter = new HttpAdapter(
    envelope.targetConfig.baseUrl,
    envelope.targetConfig.allowedOrigins,
    rateLimiter,
  );

  const startMs = Date.now();
  let completed = 0;
  let failed = 0;
  const parentSeed = hashStr(runId + shardId);
  const batch: Promise<void>[] = [];

  const regionDistribution = (envelope as unknown as Record<string, unknown>).regionDistribution as
    | { regionCode: string; agentPct: number }[]
    | undefined;

  // Metrics-aware emit wrapper
  const metricsEmit = async (type: SimForgeEventType, payload: object): Promise<void> => {
    const p = payload as Record<string, unknown>;

    switch (type) {
      case SimForgeEventType.RESPONSE_RECEIVED: {
        shardMetrics.totalRequests++;
        rpsWindow.push(Date.now());

        if (typeof p.latencyMs === 'number') {
          shardMetrics.latencies.push(p.latencyMs);
        }
        if (typeof p.statusCode === 'number') {
          const code = String(p.statusCode);
          shardMetrics.statusBreakdown[code] = (shardMetrics.statusBreakdown[code] ?? 0) + 1;
        }
        if (typeof p.regionCode === 'string' && p.regionCode) {
          shardMetrics.regionBreakdown[p.regionCode] =
            (shardMetrics.regionBreakdown[p.regionCode] ?? 0) + 1;
        }
        if (typeof p.countryCode === 'string' && p.countryCode) {
          shardMetrics.countryBreakdown[p.countryCode] =
            (shardMetrics.countryBreakdown[p.countryCode] ?? 0) + 1;
        }
        break;
      }

      case SimForgeEventType.ACTION_DLQ_SENT: {
        shardMetrics.totalErrors++;
        const errorKey = String(p.error ?? 'unknown');
        console.error(
          `[DLQ] agent=${p.agentId} node=${p.nodeId} error="${errorKey}" region=${p.regionCode}`,
        );
        const existing = shardMetrics.errorSamples.find((e) => e.error === errorKey);
        if (existing) {
          existing.count++;
        } else {
          shardMetrics.errorSamples.push({
            error: errorKey,
            count: 1,
            regionCode: typeof p.regionCode === 'string' ? p.regionCode : undefined,
          });
        }
        break;
      }

      case SimForgeEventType.AGENT_COMPLETED:
        shardMetrics.completedAgents++;
        break;

      case SimForgeEventType.AGENT_FAILED:
        shardMetrics.failedAgents++;
        break;
    }

    await emit(type, payload);
  };

  // 7. Spawn agents
  for (let i = 0; i < envelope.agentCount; i++) {
    const agentSeed = SeededRandom.childSeed(parentSeed, i);
    const agentRng = new SeededRandom(agentSeed);
    const regionProfile = pickRegionProfile(agentRng, regionDistribution);

    const agent = new AgentRuntime(
      envelope.behaviorModel,
      httpAdapter,
      rateLimiter,
      metricsEmit,
      runId,
      shardId,
      env.WORKER_ID,
      agentSeed,
      regionProfile,
    );

    batch.push(
      agent
        .run()
        .then(() => {
          completed++;
          recordResult(shardId, false);
        })
        .catch((err: Error) => {
          failed++;
          recordResult(shardId, true);
          console.error(`[Agent] ${agent.agentId} failed:`, err.message);
        }),
    );

    if (batch.length >= env.MAX_CONCURRENT_AGENTS) {
      await Promise.all(batch.splice(0));
      await job.updateProgress(Math.round(((completed + failed) / envelope.agentCount) * 100));
    }
  }

  await Promise.all(batch);
  clearInterval(rpsInterval);
  await httpAdapter.destroy();

  const durationMs = Date.now() - startMs;

  console.log(
    `[Worker:${env.WORKER_ID}] Shard ${shardId} complete — ` +
      `requests=${shardMetrics.totalRequests} errors=${shardMetrics.totalErrors} ` +
      `agents_ok=${shardMetrics.completedAgents} agents_fail=${shardMetrics.failedAgents} ` +
      `duration=${durationMs}ms`,
  );

  // 8. Post metrics to control plane
  await postMetrics({
    ...shardMetrics,
    runId,
    shardId,
    totalAgents: envelope.agentCount,
    durationMs,
  });

  await emit(SimForgeEventType.SHARD_COMPLETED, { runId, shardId, completed, failed });
  console.log(`[Worker:${env.WORKER_ID}] Shard ${shardId} — ${completed} ok / ${failed} failed`);
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const worker = new Worker(QUEUE, processJob, {
  connection: redis,
  concurrency: env.WORKER_CONCURRENCY,
  lockDuration: 60_000,
  lockRenewTime: 20_000,
});

worker.on('completed', (job) => console.log(`[Worker] Job ${job.id} done`));
worker.on('failed', (job, err) => console.error(`[Worker] Job ${job?.id} failed:`, err.message));
worker.on('error', (err) => console.error('[Worker]', err.message));

// ─── Heartbeat ────────────────────────────────────────────────────────────────

setInterval(async () => {
  await redis.set(
    `sf:worker:heartbeat:${env.WORKER_ID}`,
    JSON.stringify({
      workerId: env.WORKER_ID,
      region: env.WORKER_REGION,
      pid: process.pid,
      at: new Date().toISOString(),
    }),
    'EX',
    30,
  );
}, 10_000);

// ─── Shutdown ─────────────────────────────────────────────────────────────────

async function shutdown(sig: string): Promise<void> {
  console.log(`[Worker] ${sig} — shutting down`);
  await worker.close();
  await redis.quit();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM').catch(console.error));
process.on('SIGINT', () => shutdown('SIGINT').catch(console.error));

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  await emit(SimForgeEventType.WORKER_STARTED, {
    workerId: env.WORKER_ID,
    region: env.WORKER_REGION,
  });
  console.log(
    `[Worker:${env.WORKER_ID}] Ready — region=${env.WORKER_REGION} concurrency=${env.WORKER_CONCURRENCY}`,
  );
}

(main().catch((err: Error) => {
  failed++;
  recordResult(shardId, true);
  console.error(
    `[Agent] ${agent.agentId} FAILED:`,
    err.message,
    err.stack?.split('\n').slice(0, 3).join(' | '),
  );
}),
  // ─── Helpers ──────────────────────────────────────────────────────────────────

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  });

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
