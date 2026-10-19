import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { getEnv } from '@/lib/env';

// In-memory sliding window fallback for local testing or when Upstash is not yet connected
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

function inMemoryRateLimit(key: string, limit: number, windowSeconds: number): { success: boolean } {
  const now = Date.now();
  const entry = inMemoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { success: true };
  }

  if (entry.count >= limit) {
    return { success: false };
  }

  entry.count += 1;
  return { success: true };
}

let redisClient: Redis | null = null;
function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  const env = getEnv();
  if (env.UPSTASH_REDIS_REST_URL && !env.UPSTASH_REDIS_REST_URL.includes('dummy')) {
    redisClient = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    return redisClient;
  }
  return null;
}

/**
 * Checks rate limit for subscription submissions:
 * - 5 requests per IP per 10 minutes
 * - 3 requests per email hash per day
 */
export async function checkSubscribeRateLimit(ip: string, email: string): Promise<{ success: boolean; reason?: string }> {
  const redis = getRedis();
  const emailHash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 16);

  if (!redis) {
    // In-memory fallback
    const ipCheck = inMemoryRateLimit(`sub_ip_${ip}`, 5, 600);
    if (!ipCheck.success) return { success: false, reason: 'Too many requests from this IP.' };

    const emailCheck = inMemoryRateLimit(`sub_email_${emailHash}`, 3, 86400);
    if (!emailCheck.success) return { success: false, reason: 'Too many requests for this email today.' };

    return { success: true };
  }

  const ipLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '10 m'),
    prefix: 'sub_ip',
  });

  const emailLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '24 h'),
    prefix: 'sub_email',
  });

  const [ipRes, emailRes] = await Promise.all([
    ipLimiter.limit(ip),
    emailLimiter.limit(emailHash),
  ]);

  if (!ipRes.success) return { success: false, reason: 'Too many requests from this IP.' };
  if (!emailRes.success) return { success: false, reason: 'Too many requests for this email today.' };

  return { success: true };
}

/**
 * Checks rate limit for confirmation token attempts:
 * - 20 requests per IP per hour
 */
export async function checkConfirmRateLimit(ip: string): Promise<{ success: boolean }> {
  const redis = getRedis();
  if (!redis) {
    return inMemoryRateLimit(`confirm_ip_${ip}`, 20, 3600);
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 h'),
    prefix: 'confirm_ip',
  });

  const res = await limiter.limit(ip);
  return { success: res.success };
}
