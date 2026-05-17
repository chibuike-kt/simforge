import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { z } from 'zod';

import { SimulationJobEnvelope, SimForgeEventType } from '@simforge/shared';

import { HttpAdapter } from '../adapters/http/http.adapter';
import { AgentRuntime } from '../agent/agent-runtime';
import { SeededRandom } from '../agent/seeded-random';
import { TokenBucket } from './token-bucket';
import { verifyJobEnvelope } from '../security/job-verification';

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
  })
  .parse(process.env);

const QUEUE = 'sf:simulation-jobs';

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
  if (runId) await redis.publish(`sf:pubsub:run:${runId}`, JSON.stringify(event));
  if (env.WORKER_REGION === 'local') {
    console.log(`[Event] ${type}`);
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

  await emit(SimForgeEventType.SHARD_STARTED, { runId, shardId, agentCount: envelope.agentCount });

  // 5. Shared shard resources
  const effectiveRps = Math.min(envelope.targetConfig.maxRps, env.GLOBAL_RPS_CAP);
  const rateLimiter = new TokenBucket(effectiveRps);
  const httpAdapter = new HttpAdapter(
    envelope.targetConfig.baseUrl,
    envelope.targetConfig.allowedOrigins,
    rateLimiter,
  );

  // 6. Spawn agents
  let completed = 0;
  let failed = 0;
  const parentSeed = hashStr(runId + shardId);
  const batch: Promise<void>[] = [];

  for (let i = 0; i < envelope.agentCount; i++) {
    const seed = SeededRandom.childSeed(parentSeed, i);
    const agent = new AgentRuntime(
      envelope.behaviorModel,
      httpAdapter,
      rateLimiter,
      emit,
      runId,
      shardId,
      env.WORKER_ID,
      seed,
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
  await httpAdapter.destroy();

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

// Heartbeat
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

await emit(SimForgeEventType.WORKER_STARTED, {
  workerId: env.WORKER_ID,
  region: env.WORKER_REGION,
});

console.log(
  `[Worker:${env.WORKER_ID}] Ready — region=${env.WORKER_REGION} concurrency=${env.WORKER_CONCURRENCY}`,
);

// Graceful shutdown
async function shutdown(sig: string): Promise<void> {
  console.log(`[Worker] ${sig} — shutting down`);
  await worker.close();
  await redis.quit();
  process.exit(0);
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM').catch(console.error);
});
process.on('SIGINT', () => {
  shutdown('SIGINT').catch(console.error);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
