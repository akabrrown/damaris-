import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getEnv } from '@/lib/env';

/**
 * Creates a server-only Supabase admin client using the service role key.
 * SECURITY: NEVER expose this client or the service role key to the browser.
 */
export function createAdminClient() {
  const env = getEnv();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations.');
  }

  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
