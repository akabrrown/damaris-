import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PostKind } from '@/lib/schemas';

interface PageProps {
  searchParams: Promise<{ kind?: string; status?: string }>;
}

export default async function AdminPostsListPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/admin/login');

  let query = supabase
    .from('posts')
    .select('id, kind, title, slug, status, published_at, updated_at')
    .order('updated_at', { ascending: false });

  if (params.kind && ['poem', 'story', 'reflection', 'quote'].includes(params.kind)) {
    query = query.eq('kind', params.kind);
  }

  if (params.status && ['draft', 'published'].includes(params.status)) {
    query = query.eq('status', params.status);
  }

  const { data: posts } = await query;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="font-serif text-3xl text-ink font-normal tracking-tight">
            Writing
          </h1>
          <p className="text-sm text-muted">
            Manage your poems, stories, reflections, and quotes.
          </p>
        </div>

        <Link
          href="/admin/posts/new"
          className="px-5 py-2.5 bg-sage hover:bg-sage/80 border border-ink text-ink font-medium text-sm transition-colors"
        >
          + Write New Piece
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3 text-xs uppercase tracking-wider font-medium">
        <span className="text-muted mr-2">Filter:</span>
        <Link
          href="/admin/posts"
          className={`px-3 py-1 border ${
            !params.kind && !params.status ? 'bg-sage border-ink text-ink' : 'border-line text-muted hover:text-ink'
          }`}
        >
          All
        </Link>
        <Link
          href="/admin/posts?status=draft"
          className={`px-3 py-1 border ${
            params.status === 'draft' ? 'bg-sage border-ink text-ink' : 'border-line text-muted hover:text-ink'
          }`}
        >
          Drafts Only
        </Link>
        {(['poem', 'story', 'reflection', 'quote'] as PostKind[]).map((k) => (
          <Link
            key={k}
            href={`/admin/posts?kind=${k}`}
            className={`px-3 py-1 border ${
              params.kind === k ? 'bg-sage border-ink text-ink' : 'border-line text-muted hover:text-ink'
            }`}
          >
            {k === 'poem' ? 'Poems' : k === 'story' ? 'Stories' : k === 'reflection' ? 'Reflections' : 'Quotes'}
          </Link>
        ))}
      </div>

      {/* Posts Table / List */}
      {posts && posts.length > 0 ? (
        <div className="border border-line bg-paper divide-y divide-line/60">
          {posts.map((post) => (
            <div key={post.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-paper-deep/40 transition-colors">
              <div className="flex-1">
                <div className="flex items-center space-x-2 text-xs uppercase tracking-wider text-muted mb-1">
                  <span className="font-semibold">{post.kind}</span>
                  <span>&middot;</span>
                  <span className={post.status === 'published' ? 'text-moss' : 'text-muted'}>
                    {post.status}
                  </span>
                  <span>&middot;</span>
                  <span>Updated {new Date(post.updated_at).toLocaleDateString()}</span>
                </div>

                <Link
                  href={`/admin/posts/${post.id}`}
                  className="font-serif text-xl sm:text-2xl text-ink font-normal hover:text-moss hover:underline"
                >
                  {post.title || 'Untitled'}
                </Link>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                {post.status === 'published' && (
                  <Link
                    href={`/${post.kind === 'story' ? 'stories' : post.kind === 'reflection' ? 'reflections' : post.kind}/${post.slug}`}
                    target="_blank"
                    className="text-moss hover:text-ink underline"
                  >
                    View &rarr;
                  </Link>
                )}
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="px-3 py-1 bg-sage/60 hover:bg-sage border border-ink text-ink font-medium"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center border border-line bg-paper">
          <p className="font-serif italic text-lg text-muted">
            No writing found matching your selection.
          </p>
        </div>
      )}
    </div>
  );
}
