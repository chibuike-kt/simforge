import { createHmac } from 'crypto';

import { SimulationJobEnvelope } from '@simforge/shared';

import { getEnv } from '../config/env';

const MAX_AGE_MS = 5 * 60 * 1000;

export function signJobEnvelope(
  envelope: Omit<SimulationJobEnvelope, 'signature'>,
): SimulationJobEnvelope {
  const payload = canonical(envelope);
  const signature = createHmac('sha256', getEnv().JOB_SIGNING_SECRET)
    .update(payload)
    .digest('hex');
  return { ...envelope, signature };
}

export function verifyJobEnvelope(
  envelope: SimulationJobEnvelope,
  secret: string,
): { valid: boolean; reason?: string } {
  const age = Date.now() - new Date(envelope.signedAt).getTime();
  if (age > MAX_AGE_MS) return { valid: false, reason: `Expired (${age}ms)` };
  if (age < 0) return { valid: false, reason: 'Future timestamp' };

  const { signature, ...rest } = envelope;
  const expected = createHmac('sha256', secret)
    .update(canonical(rest))
    .digest('hex');
  if (!timingSafeEqual(signature, expected)) {
    return { valid: false, reason: 'Signature mismatch' };
  }
  return { valid: true };
}

function canonical(obj: object): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
