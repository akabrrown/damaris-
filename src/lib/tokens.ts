import crypto from 'crypto';

/**
 * Generates a 32-byte cryptographically secure random token and its SHA-256 hash.
 */
export function generateConfirmToken(): { token: string; hash: Buffer } {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = hashConfirmToken(token);
  return { token, hash };
}

/**
 * Computes SHA-256 hash of a confirmation token for database lookup.
 */
export function hashConfirmToken(token: string): Buffer {
  return crypto.createHash('sha256').update(token).digest();
}

/**
 * Generates a stateless HMAC-SHA256 token for one-click unsubscription.
 * Format: `${subscriberId}.${hmacSignature}`
 */
export function generateUnsubscribeToken(subscriberId: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret).update(subscriberId).digest('hex');
  return `${subscriberId}.${hmac}`;
}

/**
 * Verifies an unsubscribe token in constant time.
 * Returns subscriberId if valid, null otherwise.
 */
export function verifyUnsubscribeToken(token: string, secret: string): string | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [subscriberId, providedHmac] = parts;
  if (!subscriberId || !providedHmac) return null;

  // Strict check: sha256 hex must be exactly 64 hex characters
  if (!/^[0-9a-f]{64}$/i.test(providedHmac)) {
    return null;
  }

  const expectedHmac = crypto.createHmac('sha256', secret).update(subscriberId).digest('hex');

  const providedBuffer = Buffer.from(providedHmac, 'hex');
  const expectedBuffer = Buffer.from(expectedHmac, 'hex');

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  const isValid = crypto.timingSafeEqual(providedBuffer, expectedBuffer);
  return isValid ? subscriberId : null;
}
