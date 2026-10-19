import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPostBySlug, getAdjacentPosts } from '@/lib/queries';
import { renderVerse } from '@/lib/content-renderer';
import { PrevNextNav } from '@/components/prev-next-nav';
import { ShareButton } from '@/components/share-button';
import { SubscribeForm } from '@/components/subscribe-form';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug('poem', slug);
  if (!post) return { title: 'Poem Not Found' };

  return {
    title: post.title || 'Poem',
    description: post.excerpt || post.body_md.slice(0, 150),
  };
}

export default async function PoemDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug('poem', slug);

  if (!post) {
    notFound();
  }

  const { prev, next } = await getAdjacentPosts('poem', post);
  const stanzas = renderVerse(post.body_md);

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <article className="max-w-[36ch] mx-auto py-6 sm:py-12">
      {/* Poem Header */}
      <header className="mb-12 text-left">
        <div className="text-xs uppercase tracking-wider text-muted mb-3">
          <span>Poem</span> &middot; <time dateTime={post.published_at || ''}>{formattedDate}</time>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal leading-tight tracking-tight">
          {post.title}
        </h1>
      </header>

      {/* Verse body preserving stanzas, breaks, and indentations (FR-READ-02) */}
      <div className="poem-block text-ink text-left space-y-6 sm:space-y-8 my-10">
        {stanzas.map((stanza, sIdx) => (
          <p key={sIdx} className="m-0">
            {stanza.map((line, lIdx) => (
              <span key={lIdx} className="poem-line block">
                {line || '\u00A0'}
              </span>
            ))}
          </p>
        ))}
      </div>

      {/* Share Button */}
      <div className="mt-12 pt-6 border-t border-line/60 flex items-center justify-between">
        <ShareButton title={post.title || 'Poem'} />
      </div>

      {/* Prev / Next Navigation */}
      <PrevNextNav prev={prev} next={next} sectionLabel="poems" />

      {/* Compact Subscribe Prompt */}
      <div className="mt-16">
        <SubscribeForm
          layout="compact"
          heading="Read future poems"
          helper="Receive a quiet email whenever a new piece is published."
        />
      </div>
    </article>
  );
}
