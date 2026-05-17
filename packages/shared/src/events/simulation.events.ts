export enum SimForgeEventType {
  SCENARIO_CREATED = 'scenario.created',
  SCENARIO_PUBLISHED = 'scenario.published',
  SCENARIO_ARCHIVED = 'scenario.archived',

  RUN_SUBMITTED = 'run.submitted',
  RUN_APPROVED = 'run.approved',
  RUN_DISPATCHED = 'run.dispatched',
  RUN_COMPLETED = 'run.completed',
  RUN_FAILED = 'run.failed',
  RUN_CANCELLED = 'run.cancelled',

  SHARD_ASSIGNED = 'shard.assigned',
  SHARD_STARTED = 'shard.started',
  SHARD_COMPLETED = 'shard.completed',
  SHARD_FAILED = 'shard.failed',
  SHARD_CHECKPOINTED = 'shard.checkpointed',

  AGENT_SPAWNED = 'agent.spawned',
  AGENT_STATE_CHANGED = 'agent.state_changed',
  AGENT_COMPLETED = 'agent.completed',
  AGENT_FAILED = 'agent.failed',
  AGENT_LOOP_DETECTED = 'agent.loop_detected',

  ACTION_EXECUTED = 'action.executed',
  ACTION_SUCCEEDED = 'action.succeeded',
  ACTION_FAILED = 'action.failed',
  ACTION_RETRIED = 'action.retried',
  ACTION_DLQ_SENT = 'action.dlq_sent',

  REQUEST_SENT = 'request.sent',
  RESPONSE_RECEIVED = 'response.received',
  RESPONSE_TIMEOUT = 'response.timeout',

  FAILURE_DETECTED = 'failure.detected',
  FAILURE_CASCADE_STARTED = 'failure.cascade_started',
  FAILURE_RESOLVED = 'failure.resolved',

  TARGET_RATE_LIMITED = 'target.rate_limited',
  TARGET_CONNECTION_RESET = 'target.connection_reset',
  TARGET_OVERLOADED = 'target.overloaded',

  WORKER_STARTED = 'worker.started',
  WORKER_CRASHED = 'worker.crashed',
  WORKER_RECOVERED = 'worker.recovered',
}

export interface SimForgeBaseEvent {
  eventId: string;
  eventType: SimForgeEventType;
  runId: string;
  shardId: string | null;
  agentId: string | null;
  workerId: string | null;
  occurredAt: string;
  sequenceNum: number;
}
