import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PostEditor } from '@/components/post-editor';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/admin/login');

  const [{ data: post }, { count: confirmedCount }] = await Promise.all([
    supabase.from('posts').select('*').eq('id', id).single(),
    supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink font-normal tracking-tight mb-6">
        Edit {post.kind === 'poem' ? 'Poem' : post.kind === 'story' ? 'Story' : post.kind === 'reflection' ? 'Reflection' : 'Quote'}
      </h1>
      <PostEditor
        initialPost={post}
        confirmedSubscribersCount={confirmedCount || 0}
      />
    </div>
  );
}
