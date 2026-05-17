import { createHash } from 'crypto';
import { Agent, request } from 'undici';

import { HttpAction } from '@simforge/shared';

import { TokenBucket } from '../../worker/token-bucket';

export interface HttpResult {
  statusCode: number;
  latencyMs: number;
  bodyHash: string | null;
  error: string | null;
}

export class HttpAdapter {
  private readonly agent: Agent;

  constructor(
    private readonly baseUrl: string,
    private readonly allowedOrigins: string[],
    private readonly rateLimiter: TokenBucket,
    private readonly timeoutMs = 10_000,
  ) {
    this.agent = new Agent({
      connections: 100,
      pipelining: 1,
      keepAliveTimeout: 30_000,
    });
  }

  async execute(action: HttpAction, ctx: Record<string, string>): Promise<HttpResult> {
    const url = `${this.baseUrl}${this.resolve(action.pathTemplate, ctx)}`;

    const check = this.checkAllowlist(url);
    if (!check.allowed) {
      return { statusCode: 0, latencyMs: 0, bodyHash: null, error: `Allowlist: ${check.reason}` };
    }

    await this.rateLimiter.consume();

    const start = performance.now();

    try {
      const { statusCode, body } = await request(url, {
        method: action.method,
        headers: {
          'user-agent': 'SimForge/0.1 (synthetic-traffic)',
          'x-simforge': 'true',
          ...action.headers,
        },
        body: action.bodyTemplate ? this.resolve(action.bodyTemplate, ctx) : undefined,
        dispatcher: this.agent,
        bodyTimeout: this.timeoutMs,
        headersTimeout: this.timeoutMs,
      });

      const latencyMs = Math.round(performance.now() - start);
      const raw = await body.text();
      const bodyHash =
        raw.length > 0 ? createHash('sha256').update(raw).digest('hex').slice(0, 16) : null;

      if (statusCode === 429) this.rateLimiter.backOff();

      return { statusCode, latencyMs, bodyHash, error: null };
    } catch (err) {
      return {
        statusCode: 0,
        latencyMs: Math.round(performance.now() - start),
        bodyHash: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async destroy(): Promise<void> {
    await this.agent.destroy();
  }

  private checkAllowlist(url: string): { allowed: boolean; reason?: string } {
    try {
      const { origin, hostname } = new URL(url);
      const ok = this.allowedOrigins.some(
        (a) => a === origin || (a.startsWith('*.') && hostname.endsWith(a.slice(2))),
      );
      return ok ? { allowed: true } : { allowed: false, reason: `${origin} not in allowlist` };
    } catch {
      return { allowed: false, reason: `Invalid URL: ${url}` };
    }
  }

  private resolve(template: string, ctx: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, k) => ctx[k] ?? '');
  }
}
