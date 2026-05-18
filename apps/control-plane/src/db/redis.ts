import { Queue } from 'bullmq';
import IORedis from 'ioredis';

import { getEnv } from '../config/env';

let _redis: IORedis | null = null;
let _redisBullMQ: IORedis | null = null;

export function getRedis(): IORedis {
  if (!_redis) {
    _redis = new IORedis(getEnv().REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });
    _redis.on('error', (err) => console.error('[Redis]', err.message));
    _redis.on('connect', () => console.log('[Redis] Connected'));
  }
  return _redis;
}

export function getRedisBullMQ(): IORedis {
  if (!_redisBullMQ) {
    _redisBullMQ = new IORedis(getEnv().REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return _redisBullMQ;
}

export const QUEUES = {
  SIMULATION_JOBS: 'sf-simulation-jobs',
  DEAD_LETTER: 'sf-dead-letter',
} as const;

let _jobQueue: Queue | null = null;

export function getJobQueue(): Queue {
  if (!_jobQueue) {
    _jobQueue = new Queue(QUEUES.SIMULATION_JOBS, {
      connection: getRedisBullMQ(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 500 },
      },
    });
  }
  return _jobQueue;
}

export const RedisKeys = {
  agentState: (runId: string, agentId: string) =>
    `sf:agent:${runId}:${agentId}`,
  shardLock: (runId: string, shardId: string) =>
    `sf:shard:lock:${runId}:${shardId}`,
  runMetrics: (runId: string) => `sf:run:${runId}:metrics`,
  workerHeartbeat: (workerId: string) => `sf:worker:heartbeat:${workerId}`,
  runPubSub: (runId: string) => `sf:pubsub:run:${runId}`,
} as const;

export async function publishRunEvent(
  runId: string,
  event: object,
): Promise<void> {
  await getRedis().publish(RedisKeys.runPubSub(runId), JSON.stringify(event));
}

export async function closeRedis(): Promise<void> {
  await _redis?.quit();
  await _redisBullMQ?.quit();
  _redis = null;
  _redisBullMQ = null;
}
