import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PostEditor } from '@/components/post-editor';
import { PostKind } from '@/lib/schemas';

interface PageProps {
  searchParams: Promise<{ kind?: string }>;
}

export default async function NewPostPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/admin/login');

  const { count: confirmedCount } = await supabase
    .from('subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed');

  const defaultKind: PostKind =
    params.kind && ['poem', 'story', 'reflection', 'quote'].includes(params.kind)
      ? (params.kind as PostKind)
      : 'poem';

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink font-normal tracking-tight mb-6">
        Write New Piece
      </h1>
      <PostEditor
        defaultKind={defaultKind}
        confirmedSubscribersCount={confirmedCount || 0}
      />
    </div>
  );
}
