import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envCheck: Record<string, unknown> = {
    has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_url_host: process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : null,
    has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    anon_key_len: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    has_resend_key: !!process.env.RESEND_API_KEY,
    has_hmac: !!process.env.UNSUBSCRIBE_HMAC_SECRET,
  };

  let getEnvResult = 'OK';
  try {
    getEnv();
  } catch (err: unknown) {
    getEnvResult = err instanceof Error ? err.message : String(err);
  }
  envCheck.getEnvResult = getEnvResult;

  // Test direct Supabase query
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ozqllpgsshutwteyjfqw.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await client
      .from('posts')
      .select('id, kind, slug, title, status')
      .eq('status', 'published')
      .limit(5);

    envCheck.supabase_test = {
      success: !error,
      error: error ? { code: error.code, message: error.message, details: error.details } : null,
      count: data?.length ?? 0,
      posts: data?.map((p) => ({ slug: p.slug, kind: p.kind })),
    };
  } catch (err: unknown) {
    envCheck.supabase_test = {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return NextResponse.json(envCheck);
}
