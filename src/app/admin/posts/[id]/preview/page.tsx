import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { renderVerse, renderVerseLineHtml, sanitizeMarkdown } from '@/lib/content-renderer';
import { calculateReadingTime } from '@/lib/reading-time';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DraftPreviewPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/admin/login');

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (!post) notFound();

  return (
    <div>
      {/* Draft Preview Warning Banner */}
      <div className="bg-sage-soft border border-line text-ink p-3 mb-8 text-center text-xs uppercase tracking-wider font-semibold">
        Draft preview — only you can see this piece
      </div>

      {post.kind === 'poem' && (
        <article className="max-w-[36ch] mx-auto py-8">
          <header className="mb-10 text-left">
            <span className="text-xs uppercase tracking-wider text-muted block mb-2">Poem &middot; Draft</span>
            <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal">{post.title}</h1>
          </header>

          <div className="poem-block text-ink text-left space-y-6 sm:space-y-8">
            {renderVerse(post.body_md).map((stanza, sIdx) => (
              <p key={sIdx} className="m-0">
                {stanza.map((line, lIdx) => (
                  <span
                    key={lIdx}
                    className="poem-line block"
                    dangerouslySetInnerHTML={{ __html: renderVerseLineHtml(line) }}
                  />
                ))}
              </p>
            ))}
          </div>
        </article>
      )}

      {post.kind === 'quote' && (
        <article className="max-w-[52ch] mx-auto py-16 text-center">
          <blockquote className="font-serif italic text-3xl sm:text-4xl text-ink leading-relaxed font-normal">
            &ldquo;{post.body_md}&rdquo;
          </blockquote>
          <p className="mt-6 text-sm uppercase tracking-wider text-muted font-medium">
            {post.attribution ? `— ${post.attribution}` : '— Caroline Damaris Donkor'}
          </p>
        </article>
      )}

      {(post.kind === 'story' || post.kind === 'reflection') && (
        <article className="max-w-[62ch] mx-auto py-8">
          <header className="mb-8">
            <div className="text-xs uppercase tracking-wider text-muted mb-2">
              <span>{post.kind === 'story' ? 'Short Story' : 'Reflection'}</span>
              <span> &middot; {calculateReadingTime(post.body_md)} min read</span>
              <span> &middot; Draft</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl text-ink font-normal">{post.title}</h1>
            {post.excerpt && (
              <p className="font-serif italic text-lg sm:text-xl text-muted mt-3">
                {post.excerpt}
              </p>
            )}
          </header>

          <div
            className="prose-reading leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeMarkdown(post.body_md) }}
          />
        </article>
      )}
    </div>
  );
}
