import { createHash } from 'crypto';
import { Agent, request } from 'undici';

import { HttpAction } from '@simforge/shared';

import { TokenBucket } from '../../worker/token-bucket';
import { SeededRandom } from '../../agent/seeded-random';
import { resolveTemplate, resolveBody, extractFromResponse } from '../../agent/template-resolver';

export interface HttpResult {
  statusCode: number;
  latencyMs: number;
  bodyHash: string | null;
  bodyRaw: string | null;
  responseHeaders: Record<string, string>;
  error: string | null;
}

export interface HttpContext {
  sessionToken: string;
  agentId: string;
  regionCode?: string;
  countryCode?: string;
  stepIndex?: number;
  extractRules?: Record<string, string>;
  rng?: SeededRandom;
  customKv: Record<string, unknown>;
  [key: string]: unknown;
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

  async execute(action: HttpAction, ctx: HttpContext): Promise<HttpResult> {
    const regionCode = ctx.regionCode ?? 'NA_WEST';
    const countryCode = ctx.countryCode ?? 'US';
    const rng = ctx.rng ?? new SeededRandom(Date.now());
    const customKv = ctx.customKv ?? {};

    // Resolve path template — supports both {{ctx}} and {{faker.*}} variables
    const resolvedPath = resolveTemplate(
      action.pathTemplate,
      rng,
      regionCode,
      countryCode,
      customKv,
    );

    const url = `${this.baseUrl}${resolvedPath}`;

    const check = this.checkAllowlist(url);
    if (!check.allowed) {
      return {
        statusCode: 0,
        latencyMs: 0,
        bodyHash: null,
        bodyRaw: null,
        responseHeaders: {},
        error: `Allowlist: ${check.reason}`,
      };
    }

    await this.rateLimiter.consume();

    // Resolve body template
    let resolvedBody: string | undefined;
    if (action.bodyTemplate) {
      try {
        // Try parsing as JSON first — resolve each field individually
        const parsed = JSON.parse(action.bodyTemplate);
        const resolved = resolveBody(parsed, rng, regionCode, countryCode, customKv);
        resolvedBody = JSON.stringify(resolved);
      } catch {
        // Not JSON — resolve as plain string template
        resolvedBody = resolveTemplate(action.bodyTemplate, rng, regionCode, countryCode, customKv);
      }
    }

    // Resolve header values
    const resolvedHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(action.headers ?? {})) {
      resolvedHeaders[k] = resolveTemplate(v, rng, regionCode, countryCode, customKv);
    }

    const start = performance.now();

    try {
      const { statusCode, body, headers } = await request(url, {
        method: action.method,
        headers: {
          'content-type': 'application/json',
          'user-agent': 'SimForge/1.0 (synthetic-traffic)',
          'x-simforge': 'true',
          ...resolvedHeaders,
        },
        body: resolvedBody,
        dispatcher: this.agent,
        bodyTimeout: this.timeoutMs,
        headersTimeout: this.timeoutMs,
      });

      const latencyMs = Math.round(performance.now() - start);
      const raw = await body.text();
      const bodyHash =
        raw.length > 0 ? createHash('sha256').update(raw).digest('hex').slice(0, 16) : null;

      if (statusCode === 429) this.rateLimiter.backOff();

      // Flatten response headers
      const responseHeaders: Record<string, string> = {};
      for (const [k, v] of Object.entries(headers)) {
        responseHeaders[k] = Array.isArray(v) ? v.join(', ') : (v ?? '');
      }

      // Extract values from response into customKv for next steps
      if (ctx.extractRules && Object.keys(ctx.extractRules).length > 0) {
        try {
          const parsedBody = JSON.parse(raw);
          extractFromResponse(
            ctx.extractRules,
            parsedBody,
            responseHeaders,
            ctx.stepIndex ?? 0,
            customKv,
          );
        } catch {
          // Non-JSON response — skip extraction
        }
      }

      return {
        statusCode,
        latencyMs,
        bodyHash,
        bodyRaw: raw.slice(0, 500),
        responseHeaders,
        error: null,
      };
    } catch (err) {
      return {
        statusCode: 0,
        latencyMs: Math.round(performance.now() - start),
        bodyHash: null,
        bodyRaw: null,
        responseHeaders: {},
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
}
