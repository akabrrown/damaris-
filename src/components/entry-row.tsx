import React from 'react';
import Link from 'next/link';
import { Post } from '@/lib/types';
import { calculateReadingTime } from '@/lib/reading-time';
import { getPiecePath } from '@/lib/routing';

interface EntryRowProps {
  post: Post;
  showKindLabel?: boolean;
}

export function EntryRow({ post, showKindLabel = true }: EntryRowProps) {
  const href = getPiecePath(post.kind, post.slug);


  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const readingTime = (post.kind === 'story' || post.kind === 'reflection')
    ? calculateReadingTime(post.body_md)
    : null;

  if (post.kind === 'quote') {
    return (
      <article className="py-7 border-b border-line/60">
        <Link href={href} className="group block focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-4">
          <blockquote className="font-serif italic text-xl sm:text-2xl text-ink leading-relaxed group-hover:text-moss transition-colors">
            &ldquo;{post.body_md}&rdquo;
          </blockquote>
          <div className="mt-3 flex items-center justify-between text-xs text-muted uppercase tracking-wider">
            <span>{post.attribution ? `— ${post.attribution}` : '— Caroline Damaris Donkor'}</span>
            <time dateTime={post.published_at || ''}>{formattedDate}</time>
          </div>
        </Link>
      </article>
    );
  }

  if (post.kind === 'poem') {
    // Feature the strongest lines prominently as inspired by Ta Adesa and Nenta Literary Journal
    const featuredLines = post.excerpt || post.body_md.trim().split('\n').slice(0, 2).join('\n');

    return (
      <article className="py-7 border-b border-line/60">
        <Link href={href} className="group block focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-4">
          <div className="flex items-center justify-between text-xs text-muted uppercase tracking-wider mb-2">
            {showKindLabel && <span>Poem</span>}
            <time dateTime={post.published_at || ''} className="ml-auto">{formattedDate}</time>
          </div>
          {featuredLines && (
            <p className="font-serif italic text-xl sm:text-2xl text-ink leading-relaxed group-hover:text-moss transition-colors whitespace-pre-line mb-3">
              &ldquo;{featuredLines}&rdquo;
            </p>
          )}
          <h2 className="font-serif text-lg sm:text-xl font-normal text-muted group-hover:text-ink transition-colors flex items-center gap-2">
            <span>{post.title}</span>
            <span className="text-xs uppercase tracking-wider text-moss font-sans" aria-hidden="true">&rarr; Read poem</span>
          </h2>
        </Link>
      </article>
    );
  }

  // Stories and Reflections
  return (
    <article className="py-6 border-b border-line/60">
      <Link href={href} className="group block focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-4">
        <div className="flex items-center space-x-3 text-xs text-muted uppercase tracking-wider mb-1">
          {showKindLabel && <span>{post.kind === 'story' ? 'Short Story' : 'Reflection'}</span>}
          {readingTime && <span>&middot; {readingTime} min read</span>}
          <time dateTime={post.published_at || ''} className="ml-auto">{formattedDate}</time>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-ink group-hover:text-moss group-hover:underline group-hover:underline-offset-4 transition-colors">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-muted text-base mt-2 line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}
      </Link>
    </article>
  );
}
