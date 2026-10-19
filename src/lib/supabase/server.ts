import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getEnv } from '@/lib/env';

/**
 * Hardened cookie attributes strictly enforcing security:
 * - httpOnly: prevents client-side XSS from reading session tokens
 * - secure: ensures transmission over HTTPS in production
 * - sameSite: lax prevents CSRF while permitting top-level navigation
 * - path: '/' ensures consistency across all sub-paths
 */
export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

let cachedPublicClient: SupabaseClient | null = null;

/**
 * Creates or reuses a cookieless Supabase client for public content queries
 * (posts, books, site_settings).
 * Does not invoke Next.js cookies(), enabling static pre-rendering (ISR/SSG)
 * and ensuring zero cookies are set on public readers.
 */
export function createPublicClient(): SupabaseClient {
  if (cachedPublicClient) return cachedPublicClient;

  const env = getEnv();
  cachedPublicClient = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );

  return cachedPublicClient;
}

/**
 * Creates an RLS-scoped Supabase client bound to secure request cookies
 * for authenticated Server Components, Server Actions, and Route Handlers.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const env = getEnv();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: SECURE_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...SECURE_COOKIE_OPTIONS,
              })
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

