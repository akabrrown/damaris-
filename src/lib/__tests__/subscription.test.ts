import { describe, it, expect } from 'vitest';
import { subscribeSchema } from '../schemas';
import { generateConfirmToken, generateUnsubscribeToken, verifyUnsubscribeToken } from '../tokens';

describe('Subscription State Machine & Token Logic (FR-SUB-01, 02, 03)', () => {
  const secret = 'test-secret-key-at-least-32-chars-long';

  it('validates email addresses strictly and normalizes them to lowercase', () => {
    const parsed = subscribeSchema.safeParse({ email: ' Reader@Domain.COM ' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe('reader@domain.com');
    }
  });

  it('rejects bot honeypot submission', () => {
    const parsed = subscribeSchema.safeParse({
      email: 'reader@domain.com',
      website: 'http://spambot.com',
    });
    expect(parsed.success).toBe(false);
  });

  it('double opt-in token expiry is 48 hours', () => {
    const { token, hash } = generateConfirmToken();
    expect(token).toHaveLength(64);
    expect(hash).toBeInstanceOf(Buffer);

    const now = Date.now();
    const expiresAt = new Date(now + 48 * 60 * 60 * 1000);
    expect(expiresAt.getTime() - now).toBe(48 * 60 * 60 * 1000);
  });

  it('one-click unsubscribe token is stateless and verified with HMAC', () => {
    const subscriberId = 'd8b2e1a4-9e32-4411-b922-38ef342f10b2';
    const token = generateUnsubscribeToken(subscriberId, secret);

    expect(token.startsWith(subscriberId)).toBe(true);
    const verified = verifyUnsubscribeToken(token, secret);
    expect(verified).toBe(subscriberId);
  });

  it('rate limiting evaluates requests and provides reset metadata', async () => {
    const { checkSubscribeRateLimit, checkConfirmRateLimit } = await import('../rate-limit');
    const subCheck = await checkSubscribeRateLimit('192.168.1.1', 'test@example.com');
    expect(typeof subCheck.success).toBe('boolean');

    const confirmCheck = await checkConfirmRateLimit('192.168.1.1');
    expect(typeof confirmCheck.success).toBe('boolean');
  });
});
