import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPostBySlug, getAdjacentPosts, getPostComments } from '@/lib/queries';
import { sanitizeMarkdown } from '@/lib/content-renderer';
import { calculateReadingTime } from '@/lib/reading-time';
import { PrevNextNav } from '@/components/prev-next-nav';
import { ShareButton } from '@/components/share-button';
import { CommentsSection } from '@/components/comments-section';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug('story', slug);
  if (!post) return { title: 'Story Not Found' };

  return {
    title: post.title || 'Short Story',
    description: post.excerpt || post.body_md.slice(0, 150),
    openGraph: post.featured_image_path
      ? {
          images: [{ url: post.featured_image_path, alt: post.featured_image_alt || post.title || 'Featured artwork' }],
        }
      : undefined,
  };
}

export default async function StoryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug('story', slug);

  if (!post) {
    notFound();
  }

  const [{ prev, next }, comments] = await Promise.all([
    getAdjacentPosts('story', post),
    getPostComments(post.id),
  ]);
  const readingTime = calculateReadingTime(post.body_md);
  const bodyHtml = sanitizeMarkdown(post.body_md);

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <article className="max-w-[62ch] mx-auto py-6 sm:py-12">
      {/* Header */}
      <header className="mb-10 sm:mb-12">
        <div className="flex items-center space-x-2 text-xs uppercase tracking-wider text-muted mb-3">
          <span>Short Story</span>
          <span>&middot;</span>
          <span>{readingTime} min read</span>
          <span>&middot;</span>
          <time dateTime={post.published_at || ''}>{formattedDate}</time>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl text-ink font-normal leading-tight tracking-tight">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="font-serif italic text-xl sm:text-2xl text-ink mt-4 leading-relaxed">
            &ldquo;{post.excerpt}&rdquo;
          </p>
        )}
      </header>

      {/* Featured Artwork Vignette */}
      {post.featured_image_path && (
        <figure className="my-6 sm:my-10 flex flex-col items-center">
          <div className="w-full max-w-[280px] sm:max-w-[440px] md:max-w-[580px] p-1.5 sm:p-2 bg-paper/60 border border-ink/25 shadow-xs">
            <div className="w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden border border-ink/15 bg-paper-deep">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.featured_image_path}
                alt={post.featured_image_alt || post.title || 'Story featured artwork'}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          {post.featured_image_caption && (
            <figcaption className="text-xs text-muted font-sans italic text-center mt-2.5 max-w-md">
              {post.featured_image_caption}
            </figcaption>
          )}
        </figure>
      )}

      {/* Prose Body */}
      <div
        className="prose-reading leading-relaxed"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />

      {/* Share Button */}
      <div className="mt-12 pt-6 border-t border-line/60 flex items-center justify-between">
        <ShareButton title={post.title || 'Short Story'} excerpt={post.excerpt || undefined} />
      </div>

      {/* Prev / Next Navigation */}
      <PrevNextNav prev={prev} next={next} sectionLabel="stories" />

      {/* Reader Comments Section */}
      <CommentsSection
        postId={post.id}
        allowComments={post.allow_comments ?? true}
        initialComments={comments}
      />
    </article>
  );
}
