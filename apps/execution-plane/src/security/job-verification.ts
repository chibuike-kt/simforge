import { createHmac } from 'crypto';

import { SimulationJobEnvelope } from '@simforge/shared';

const MAX_AGE_MS = 5 * 60 * 1000;

export function verifyJobEnvelope(
  envelope: SimulationJobEnvelope,
  secret: string,
): { valid: boolean; reason?: string } {
  const age = Date.now() - new Date(envelope.signedAt).getTime();
  if (age > MAX_AGE_MS) return { valid: false, reason: `Expired (${age}ms)` };
  if (age < 0) return { valid: false, reason: 'Future timestamp' };

  const { signature, ...rest } = envelope;
  const payload = JSON.stringify(rest, Object.keys(rest).sort());
  const expected = createHmac('sha256', secret).update(payload).digest('hex');

  if (!timingSafeEqual(signature, expected)) {
    return { valid: false, reason: 'Signature mismatch' };
  }
  return { valid: true };
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
