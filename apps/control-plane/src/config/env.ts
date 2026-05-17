import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_SERVICE_NAME: z.string().default('simforge-control-plane'),
  JOB_SIGNING_SECRET: z.string().min(32),
  MAX_SCENARIO_AGENTS: z.coerce.number().default(10_000_000),
  DEFAULT_APPROVAL_THRESHOLD: z.coerce.number().default(10_000),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env;

export function getEnv(): Env {
  if (!_env) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error('Invalid environment:');
      console.error(result.error.format());
      process.exit(1);
    }
    _env = result.data;
  }
  return _env;
}
