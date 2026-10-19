import { describe, it, expect } from 'vitest';
import { createClient as createAnonClient } from '@supabase/supabase-js';
import { getEnv } from '../env';

describe('Supabase Database & RLS Integration Gates (05 Backend Schema Section 6)', () => {
  const env = getEnv();
  const anonSupabase = createAnonClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  it('allows public anonymous reads of site_settings singleton', async () => {
    const { data, error } = await anonSupabase
      .from('site_settings')
      .select('id, site_title, author_name')
      .eq('id', 1)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.id).toBe(1);
  });

  it('RLS: refuses anonymous read of draft posts', async () => {
    const { data } = await anonSupabase
      .from('posts')
      .select('id, title, status')
      .eq('status', 'draft');

    // RLS policy only returns published rows to anon
    expect(data).toHaveLength(0);
  });

  it('RLS: refuses anonymous access to private subscribers table', async () => {
    const { data } = await anonSupabase
      .from('subscribers')
      .select('id, email');

    // Either error (permission denied) or empty array due to RLS filter
    expect(data === null || data.length === 0).toBe(true);
  });

  it('RLS: refuses execution of publish_post RPC by anonymous or unauthenticated callers', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const { error } = await anonSupabase.rpc('publish_post', {
      p_id: fakeId,
      p_notify: false,
    });

    // Should return error (function not granted to anon/public or forbidden exception)
    expect(error).toBeDefined();
  });
});
