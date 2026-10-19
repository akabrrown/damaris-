import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getEnv } from '@/lib/env';

/**
 * Creates a server-only Supabase admin client using the service role key.
 * SECURITY: NEVER expose this client or the service role key to the browser.
 */
export function createAdminClient() {
  const env = getEnv();
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
