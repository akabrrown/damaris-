import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPostBySlug, getAdjacentPosts, getSiteSettings, getPostComments } from '@/lib/queries';
import { PrevNextNav } from '@/components/prev-next-nav';
import { ShareButton } from '@/components/share-button';
import { CommentsSection } from '@/components/comments-section';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug('quote', slug);
  if (!post) return { title: 'Quote Not Found' };

  return {
    title: `Quote: "${post.body_md.slice(0, 50)}..."`,
    description: post.body_md.slice(0, 160),
  };
}

export default async function QuoteDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([
    getPostBySlug('quote', slug),
    getSiteSettings(),
  ]);

  if (!post) {
    notFound();
  }

  const [{ prev, next }, comments] = await Promise.all([
    getAdjacentPosts('quote', post),
    getPostComments(post.id),
  ]);

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <article className="max-w-[52ch] mx-auto py-12 sm:py-20 text-center">
      <div className="w-12 h-1 bg-sage mx-auto mb-8" aria-hidden="true" />

      {/* Quote Heading & Body */}
      <blockquote className="font-serif italic text-2xl sm:text-4xl text-ink leading-relaxed font-normal">
        &ldquo;{post.body_md}&rdquo;
      </blockquote>

      {/* Attribution & Date */}
      <div className="mt-8 text-sm uppercase tracking-wider text-muted">
        <p className="font-medium">
          {post.attribution ? `— ${post.attribution}` : `— ${settings?.author_name || 'Author'}`}
        </p>
        <time dateTime={post.published_at || ''} className="text-xs text-muted/70 block mt-1">
          {formattedDate}
        </time>
      </div>

      {/* Share Button */}
      <div className="mt-12 pt-6 border-t border-line/60 flex items-center justify-center">
        <ShareButton title={`Quote: "${post.body_md.slice(0, 60)}"`} excerpt={post.body_md} />
      </div>

      {/* Prev / Next Navigation */}
      <div className="text-left">
        <PrevNextNav prev={prev} next={next} sectionLabel="quotes" />
      </div>

      {/* Reader Comments Section */}
      <div className="text-left mt-8">
        <CommentsSection
          postId={post.id}
          allowComments={post.allow_comments ?? true}
          initialComments={comments}
        />
      </div>
    </article>
  );
}
