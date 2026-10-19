import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { getEnv } from '@/lib/env';

export interface RateLimitResult {
  success: boolean;
  reason?: string;
  reset?: number; // Unix timestamp in ms when window resets
}

// In-memory sliding window fallback for local testing, offline, or transient Redis failures
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

function inMemoryRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const entry = inMemoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowSeconds * 1000;
    inMemoryStore.set(key, { count: 1, resetAt });
    return { success: true, reset: resetAt };
  }

  if (entry.count >= limit) {
    return { success: false, reset: entry.resetAt };
  }

  entry.count += 1;
  return { success: true, reset: entry.resetAt };
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

// Shared in-memory cache to reduce Upstash REST calls in the same serverless runtime (redis-caching rule)
const ephemeralCache = new Map();

let ipLimiter: Ratelimit | null = null;
let emailLimiter: Ratelimit | null = null;
let confirmLimiter: Ratelimit | null = null;

function getIpLimiter(redis: Redis): Ratelimit {
  if (!ipLimiter) {
    ipLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '10 m'),
      prefix: 'writers:sub_ip',
      ephemeralCache,
    });
  }
  return ipLimiter;
}

function getEmailLimiter(redis: Redis): Ratelimit {
  if (!emailLimiter) {
    emailLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '24 h'),
      prefix: 'writers:sub_email',
      ephemeralCache,
    });
  }
  return emailLimiter;
}

function getConfirmLimiter(redis: Redis): Ratelimit {
  if (!confirmLimiter) {
    confirmLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 h'),
      prefix: 'writers:confirm_ip',
      ephemeralCache,
    });
  }
  return confirmLimiter;
}

/**
 * Checks rate limit for subscription submissions:
 * - 5 requests per IP per 10 minutes
 * - 3 requests per email hash per 24 hours
 */
export async function checkSubscribeRateLimit(ip: string, email: string): Promise<RateLimitResult> {
  const emailHash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 16);
  const redis = getRedis();

  if (!redis) {
    // In-memory fallback
    const ipCheck = inMemoryRateLimit(`sub_ip_${ip}`, 5, 600);
    if (!ipCheck.success) return { success: false, reason: 'Too many requests from this IP.', reset: ipCheck.reset };

    const emailCheck = inMemoryRateLimit(`sub_email_${emailHash}`, 3, 86400);
    if (!emailCheck.success) return { success: false, reason: 'Too many requests for this email today.', reset: emailCheck.reset };

    return { success: true };
  }

  try {
    const [ipRes, emailRes] = await Promise.all([
      getIpLimiter(redis).limit(ip),
      getEmailLimiter(redis).limit(emailHash),
    ]);

    if (!ipRes.success) {
      return { success: false, reason: 'Too many requests from this IP.', reset: ipRes.reset };
    }
    if (!emailRes.success) {
      return { success: false, reason: 'Too many requests for this email today.', reset: emailRes.reset };
    }

    return { success: true, reset: Math.min(ipRes.reset, emailRes.reset) };
  } catch (error) {
    console.error('[RateLimit Warning] Upstash Redis call failed, using graceful fallback:', error);
    // Fail-soft: use in-memory sliding window so user requests are not broken by a third-party outage
    const ipCheck = inMemoryRateLimit(`sub_ip_${ip}`, 5, 600);
    if (!ipCheck.success) return { success: false, reason: 'Too many requests from this IP.', reset: ipCheck.reset };

    const emailCheck = inMemoryRateLimit(`sub_email_${emailHash}`, 3, 86400);
    if (!emailCheck.success) return { success: false, reason: 'Too many requests for this email today.', reset: emailCheck.reset };

    return { success: true };
  }
}

/**
 * Checks rate limit for confirmation token attempts:
 * - 20 requests per IP per hour
 */
export async function checkConfirmRateLimit(ip: string): Promise<RateLimitResult> {
  const redis = getRedis();

  if (!redis) {
    return inMemoryRateLimit(`confirm_ip_${ip}`, 20, 3600);
  }

  try {
    const res = await getConfirmLimiter(redis).limit(ip);
    return { success: res.success, reset: res.reset };
  } catch (error) {
    console.error('[RateLimit Warning] Upstash Redis call failed for confirm check, using graceful fallback:', error);
    return inMemoryRateLimit(`confirm_ip_${ip}`, 20, 3600);
  }
}
