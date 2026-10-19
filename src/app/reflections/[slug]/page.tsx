import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPostBySlug, getAdjacentPosts } from '@/lib/queries';
import { sanitizeMarkdown } from '@/lib/content-renderer';
import { calculateReadingTime } from '@/lib/reading-time';
import { PrevNextNav } from '@/components/prev-next-nav';
import { ShareButton } from '@/components/share-button';
import { SubscribeForm } from '@/components/subscribe-form';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug('reflection', slug);
  if (!post) return { title: 'Reflection Not Found' };

  return {
    title: post.title || 'Reflection',
    description: post.excerpt || post.body_md.slice(0, 150),
  };
}

export default async function ReflectionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug('reflection', slug);

  if (!post) {
    notFound();
  }

  const { prev, next } = await getAdjacentPosts('reflection', post);
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
          <span>Reflection</span>
          <span>&middot;</span>
          <span>{readingTime} min read</span>
          <span>&middot;</span>
          <time dateTime={post.published_at || ''}>{formattedDate}</time>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl text-ink font-normal leading-tight tracking-tight">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="font-serif italic text-lg sm:text-xl text-muted mt-4 leading-relaxed">
            {post.excerpt}
          </p>
        )}
      </header>

      {/* Prose Body */}
      <div
        className="prose-reading leading-relaxed"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />

      {/* Share Button */}
      <div className="mt-12 pt-6 border-t border-line/60 flex items-center justify-between">
        <ShareButton title={post.title || 'Reflection'} />
      </div>

      {/* Prev / Next Navigation */}
      <PrevNextNav prev={prev} next={next} sectionLabel="reflections" />

      {/* Compact Subscribe Prompt */}
      <div className="mt-16">
        <SubscribeForm
          layout="compact"
          heading="Read future reflections"
          helper="Receive a quiet email whenever a new piece is published."
        />
      </div>
    </article>
  );
}
