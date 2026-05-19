import postgres from 'postgres';

import { getEnv } from '../config/env';

let _sql: postgres.Sql | null = null;

export function getDb(): postgres.Sql {
  if (!_sql) {
    _sql = postgres(getEnv().DATABASE_URL, {
      max: 20,
      idle_timeout: 30,
      connect_timeout: 10,
      transform: postgres.camel,
    });
  }
  return _sql;
}

export async function closeDb(): Promise<void> {
  if (_sql) {
    await _sql.end();
    _sql = null;
  }
}

export async function runMigrations(): Promise<void> {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const applied = await sql<{ version: string }[]>`
    SELECT version FROM schema_migrations ORDER BY version
  `;
  const appliedSet = new Set(applied.map((r) => r.version));

  for (const migration of MIGRATIONS) {
    if (appliedSet.has(migration.version)) continue;
    console.log(`  → Applying ${migration.version}`);
    await sql.begin(async (tx) => {
      await tx.unsafe(migration.sql);
      await tx`
        INSERT INTO schema_migrations (version) VALUES (${migration.version})
      `;
    });
    console.log(`  ✓ ${migration.version} applied`);
  }
}

const MIGRATIONS = [
  {
    version: '001_initial_schema',
    sql: `
      CREATE TABLE IF NOT EXISTS target_system_profiles (
        id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name                        TEXT NOT NULL,
        allowed_origins             TEXT[] NOT NULL DEFAULT '{}',
        max_rps                     INTEGER NOT NULL DEFAULT 100,
        max_concurrency             INTEGER NOT NULL DEFAULT 1000,
        mode                        TEXT NOT NULL DEFAULT 'sandbox'
                                      CHECK (mode IN ('sandbox', 'shadow', 'production')),
        approval_threshold          INTEGER NOT NULL DEFAULT 10000,
        rate_limit_feedback_enabled BOOLEAN NOT NULL DEFAULT true,
        verified_at                 TIMESTAMPTZ,
        created_by                  UUID NOT NULL,
        created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS behavior_models (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        version        INTEGER NOT NULL DEFAULT 1,
        name           TEXT NOT NULL,
        description    TEXT,
        entry_node_id  TEXT NOT NULL,
        state_graph    JSONB NOT NULL,
        compiled_hash  TEXT NOT NULL,
        created_by     UUID NOT NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (id, version)
      );

      CREATE TABLE IF NOT EXISTS simulation_scenarios (
        id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        version                  INTEGER NOT NULL DEFAULT 1,
        name                     TEXT NOT NULL,
        description              TEXT,
        target_system_id         UUID NOT NULL REFERENCES target_system_profiles(id),
        behavior_model_id        UUID NOT NULL REFERENCES behavior_models(id),
        traffic_pattern          JSONB NOT NULL,
        geographic_distribution  JSONB NOT NULL DEFAULT '{}',
        status                   TEXT NOT NULL DEFAULT 'draft'
                                   CHECK (status IN ('draft', 'published', 'archived')),
        created_by               UUID NOT NULL,
        created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS simulation_runs (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scenario_id       UUID NOT NULL REFERENCES simulation_scenarios(id),
        scenario_version  INTEGER NOT NULL,
        status            TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN (
                              'pending','approved','dispatched','running',
                              'completed','failed','cancelled'
                            )),
        approved_by       UUID,
        approved_at       TIMESTAMPTZ,
        started_at        TIMESTAMPTZ,
        completed_at      TIMESTAMPTZ,
        worker_assignment JSONB NOT NULL DEFAULT '{}',
        checkpoint_state  JSONB,
        audit_trail       JSONB[] NOT NULL DEFAULT '{}',
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS virtual_users (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id            UUID NOT NULL REFERENCES simulation_runs(id),
        shard_id          TEXT NOT NULL,
        behavior_model_id UUID NOT NULL REFERENCES behavior_models(id),
        current_node_id   TEXT NOT NULL,
        session_token     TEXT NOT NULL,
        history_ring      TEXT[] NOT NULL DEFAULT '{}',
        cooldown_until    BIGINT NOT NULL DEFAULT 0,
        retry_count       SMALLINT NOT NULL DEFAULT 0,
        entropy_seed      BIGINT NOT NULL,
        custom_kv         JSONB NOT NULL DEFAULT '{}',
        status            TEXT NOT NULL DEFAULT 'spawned',
        spawned_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_active_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_runs_scenario    ON simulation_runs(scenario_id);
      CREATE INDEX IF NOT EXISTS idx_runs_status      ON simulation_runs(status);
      CREATE INDEX IF NOT EXISTS idx_vusers_run_id    ON virtual_users(run_id);
      CREATE INDEX IF NOT EXISTS idx_vusers_shard_id  ON virtual_users(shard_id);
      CREATE INDEX IF NOT EXISTS idx_scenarios_status ON simulation_scenarios(status);
    `,
  },
  {
    version: '002_users_table',
    sql: `
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email         TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `,
  },
];
