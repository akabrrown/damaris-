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
      <article className="my-4 border border-ink bg-sage hover:bg-sage/85 text-ink p-6 sm:p-7 transition-all duration-200 shadow-2xs">
        <Link href={href} className="group block focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-4">
          <blockquote className="font-serif italic text-xl sm:text-2xl text-ink leading-relaxed">
            &ldquo;{post.body_md}&rdquo;
          </blockquote>
          <div className="mt-4 pt-3 border-t border-ink/20 flex items-center justify-between text-xs text-ink/80 uppercase tracking-wider font-medium">
            <span>{post.attribution ? `— ${post.attribution}` : null}</span>
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
      <article className="my-4 border border-ink bg-sage hover:bg-sage/85 text-ink p-6 sm:p-7 transition-all duration-200 shadow-2xs">
        <Link href={href} className="group block focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-4">
          <div className="flex items-center justify-between text-xs text-ink/80 uppercase tracking-wider mb-3 font-medium">
            {showKindLabel && (
              <span className="px-2 py-0.5 bg-paper border border-ink text-ink text-[10px] tracking-widest font-sans">
                POEM
              </span>
            )}
            <time dateTime={post.published_at || ''} className="ml-auto">{formattedDate}</time>
          </div>
          {featuredLines && (
            <p className="font-serif italic text-xl sm:text-2xl text-ink leading-relaxed whitespace-pre-line mb-3">
              &ldquo;{featuredLines}&rdquo;
            </p>
          )}
          <h2 className="font-serif text-lg sm:text-xl font-normal text-ink flex items-center justify-between gap-2">
            <span>{post.title}</span>
            <span className="text-xs uppercase tracking-wider text-ink font-sans font-medium group-hover:underline" aria-hidden="true">&rarr; Read</span>
          </h2>
        </Link>
      </article>
    );
  }

  // Stories and Reflections
  return (
    <article className="my-4 border border-ink bg-sage hover:bg-sage/85 text-ink p-6 sm:p-7 transition-all duration-200 shadow-2xs">
      <Link href={href} className="group block focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-4">
        <div className="flex items-center space-x-3 text-xs text-ink/80 uppercase tracking-wider mb-2 font-medium">
          {showKindLabel && (
            <span className="px-2 py-0.5 bg-paper border border-ink text-ink text-[10px] tracking-widest font-sans">
              {post.kind === 'story' ? 'SHORT STORY' : 'REFLECTION'}
            </span>
          )}
          {readingTime && <span>&middot; {readingTime} min read</span>}
          <time dateTime={post.published_at || ''} className="ml-auto">{formattedDate}</time>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-ink group-hover:underline group-hover:underline-offset-4 transition-colors">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="font-serif italic text-xl sm:text-2xl text-ink leading-relaxed my-3 line-clamp-3">
            &ldquo;{post.excerpt}&rdquo;
          </p>
        )}
        <div className="mt-4 pt-3 border-t border-ink/20 flex items-center justify-end text-xs uppercase tracking-wider text-ink font-sans font-medium">
          <span className="group-hover:underline">Read &rarr;</span>
        </div>
      </Link>
    </article>
  );
}
