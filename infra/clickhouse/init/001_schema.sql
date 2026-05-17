CREATE DATABASE IF NOT EXISTS simforge_analytics;

CREATE TABLE IF NOT EXISTS simforge_analytics.execution_events (
  event_id     UUID,
  event_type   LowCardinality(String),
  run_id       UUID,
  shard_id     String,
  agent_id     Nullable(UUID),
  worker_id    LowCardinality(String),
  occurred_at  DateTime64(3, 'UTC'),
  sequence_num UInt64,
  payload      String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(occurred_at)
ORDER BY (run_id, occurred_at, sequence_num);

CREATE TABLE IF NOT EXISTS simforge_analytics.request_metrics (
  run_id       UUID,
  agent_id     UUID,
  worker_id    LowCardinality(String),
  node_id      String,
  method       LowCardinality(String),
  url_path     String,
  status_code  UInt16,
  latency_ms   UInt32,
  sent_at      DateTime64(3, 'UTC')
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(sent_at)
ORDER BY (run_id, sent_at, latency_ms);

CREATE TABLE IF NOT EXISTS simforge_analytics.system_metrics_snapshots (
  run_id           UUID,
  snapshot_at      DateTime64(3, 'UTC'),
  active_agents    UInt32,
  active_workers   UInt16,
  current_rps      Float32,
  p50_latency_ms   UInt32,
  p95_latency_ms   UInt32,
  p99_latency_ms   UInt32,
  error_rate       Float32,
  queue_depth      UInt32,
  total_requests   UInt64,
  total_failures   UInt32
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(snapshot_at)
ORDER BY (run_id, snapshot_at);

CREATE TABLE IF NOT EXISTS simforge_analytics.failure_events (
  run_id             UUID,
  failure_id         UUID,
  failure_type       LowCardinality(String),
  affected_component String,
  error_rate         Float32,
  detected_at        DateTime64(3, 'UTC'),
  resolved_at        Nullable(DateTime64(3, 'UTC')),
  payload            String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(detected_at)
ORDER BY (run_id, detected_at);

CREATE MATERIALIZED VIEW IF NOT EXISTS simforge_analytics.latency_by_minute
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(minute)
ORDER BY (run_id, minute)
AS SELECT
  run_id,
  toStartOfMinute(sent_at) AS minute,
  quantileState(0.50)(latency_ms) AS p50_state,
  quantileState(0.95)(latency_ms) AS p95_state,
  quantileState(0.99)(latency_ms) AS p99_state,
  count() AS requests,
  countIf(status_code >= 500) AS errors
FROM simforge_analytics.request_metrics
GROUP BY run_id, minute;
