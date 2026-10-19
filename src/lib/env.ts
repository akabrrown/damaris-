import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ozqllpgsshutwteyjfqw.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional().default(process.env.SUPABASE_SERVICE_ROLE_KEY || ''),
  RESEND_API_KEY: z.string().min(1).default('re_dummy_key'),
  RESEND_WEBHOOK_SECRET: z.string().min(1).optional().default('whsec_dummy'),
  MAIL_FROM: z.string().min(1).default('Caroline Damaris Donkor <noreply@carolinedamaris.com>'),
  QSTASH_TOKEN: z.string().min(1).optional().default('dummy_qstash_token'),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(1).optional().default('dummy_current_key'),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(1).optional().default('dummy_next_key'),
  UPSTASH_REDIS_REST_URL: z.string().url().optional().default('https://dummy.upstash.io'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional().default('dummy_redis_token'),
  UNSUBSCRIBE_HMAC_SECRET: z.string().min(16).default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://carolinedamaris.vercel.app'),
});

export type Env = z.infer<typeof envSchema>;

function cleanEnv(val?: string): string | undefined {
  if (val === undefined || val === null) return undefined;
  const trimmed = val.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

let parsedEnv: Env | null = null;

export function getEnv(): Env {
  if (parsedEnv) return parsedEnv;

  const result = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),
    RESEND_API_KEY: cleanEnv(process.env.RESEND_API_KEY),
    RESEND_WEBHOOK_SECRET: cleanEnv(process.env.RESEND_WEBHOOK_SECRET),
    MAIL_FROM: cleanEnv(process.env.MAIL_FROM),
    QSTASH_TOKEN: cleanEnv(process.env.QSTASH_TOKEN),
    QSTASH_CURRENT_SIGNING_KEY: cleanEnv(process.env.QSTASH_CURRENT_SIGNING_KEY),
    QSTASH_NEXT_SIGNING_KEY: cleanEnv(process.env.QSTASH_NEXT_SIGNING_KEY),
    UPSTASH_REDIS_REST_URL: cleanEnv(process.env.UPSTASH_REDIS_REST_URL),
    UPSTASH_REDIS_REST_TOKEN: cleanEnv(process.env.UPSTASH_REDIS_REST_TOKEN),
    UNSUBSCRIBE_HMAC_SECRET: cleanEnv(process.env.UNSUBSCRIBE_HMAC_SECRET),
    NEXT_PUBLIC_SITE_URL: cleanEnv(process.env.NEXT_PUBLIC_SITE_URL),
  });

  if (!result.success) {
    const errorDetails = JSON.stringify(result.error.format(), null, 2);
    // In build or test environments without all variables populated, provide safe fallback
    if (process.env.NODE_ENV === 'test' || process.env.NEXT_PHASE === 'phase-production-build') {
      console.warn('Environment validation warning:', errorDetails);
      parsedEnv = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service',
        RESEND_API_KEY: process.env.RESEND_API_KEY || 're_dummy',
        RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET || 'whsec_dummy',
        MAIL_FROM: process.env.MAIL_FROM || 'Author <noreply@example.com>',
        QSTASH_TOKEN: process.env.QSTASH_TOKEN || 'dummy_qstash',
        QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY || 'dummy_key',
        QSTASH_NEXT_SIGNING_KEY: process.env.QSTASH_NEXT_SIGNING_KEY || 'dummy_next',
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || 'https://dummy.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || 'dummy_token',
        UNSUBSCRIBE_HMAC_SECRET: process.env.UNSUBSCRIBE_HMAC_SECRET || '0123456789abcdef0123456789abcdef',
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      };
      return parsedEnv;
    }
    throw new Error(`Invalid environment variables:\n${errorDetails}`);
  }

  parsedEnv = result.data;
  return parsedEnv;
}
