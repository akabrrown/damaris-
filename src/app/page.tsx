import React from 'react';
import Link from 'next/link';
import { getSiteSettings, getRecentPosts } from '@/lib/queries';
import { EntryRow } from '@/components/entry-row';
import { SubscribeForm } from '@/components/subscribe-form';

export const revalidate = 3600; // 1 hour fallback; on-demand revalidated on publish

export default async function HomePage() {
  const [settings, recentPosts] = await Promise.all([
    getSiteSettings(),
    getRecentPosts(6),
  ]);

  const authorName = settings?.author_name || 'Caroline Damaris Donkor';
  const tagline = settings?.tagline || 'I give the unsaid a language of its own';

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Intro Header */}
      <section aria-labelledby="intro-heading" className="max-w-[720px] pt-4 sm:pt-8">
        <div className="w-12 h-1 bg-sage mb-6" aria-hidden="true" />
        <h1
          id="intro-heading"
          className="font-serif text-3xl sm:text-5xl lg:text-6xl text-ink font-normal leading-[1.15] tracking-tight"
        >
          {authorName}
        </h1>
        <p className="font-serif text-xl sm:text-2xl text-muted font-normal mt-4 leading-relaxed">
          {tagline}
        </p>
      </section>

      {/* Primary Subscribe Panel */}
      <section aria-label="Subscribe to updates">
        <SubscribeForm
          layout="panel"
          heading="New writing, by email."
          helper="Just your email address. One quiet message when something new is published. Unsubscribe any time."
        />
      </section>

      {/* Recent Writing Section */}
      <section aria-labelledby="recent-heading">
        <div className="flex items-center justify-between border-b border-line pb-4 mb-2">
          <h2 id="recent-heading" className="font-serif text-2xl sm:text-3xl text-ink font-normal">
            Recent writing
          </h2>
          <span className="text-xs uppercase tracking-wider text-muted">Newest first</span>
        </div>

        {recentPosts.length > 0 ? (
          <div className="divide-y divide-line/60">
            {recentPosts.map((post) => (
              <EntryRow key={post.id} post={post} showKindLabel={true} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center border-b border-line/40">
            <p className="font-serif italic text-xl text-muted">
              Nothing here yet. The first piece is on its way.
            </p>
          </div>
        )}
      </section>

      {/* Sections Overview Links */}
      <section aria-labelledby="sections-heading" className="pt-8 border-t border-line">
        <h2 id="sections-heading" className="text-xs uppercase tracking-wider text-muted font-semibold mb-6">
          Explore by section
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <Link
            href="/poetry"
            className="p-4 border border-line bg-paper hover:bg-paper-deep text-ink transition-colors block"
          >
            <span className="font-serif text-lg block">Poetry</span>
            <span className="text-xs text-muted mt-1 block">Verses &amp; lines</span>
          </Link>
          <Link
            href="/stories"
            className="p-4 border border-line bg-paper hover:bg-paper-deep text-ink transition-colors block"
          >
            <span className="font-serif text-lg block">Stories</span>
            <span className="text-xs text-muted mt-1 block">Short fiction</span>
          </Link>
          <Link
            href="/reflections"
            className="p-4 border border-line bg-paper hover:bg-paper-deep text-ink transition-colors block"
          >
            <span className="font-serif text-lg block">Reflections</span>
            <span className="text-xs text-muted mt-1 block">Essays &amp; thoughts</span>
          </Link>
          <Link
            href="/quotes"
            className="p-4 border border-line bg-paper hover:bg-paper-deep text-ink transition-colors block"
          >
            <span className="font-serif text-lg block">Quotes</span>
            <span className="text-xs text-muted mt-1 block">Short lines</span>
          </Link>
          <Link
            href="/books"
            className="p-4 border border-line bg-paper hover:bg-paper-deep text-ink transition-colors block"
          >
            <span className="font-serif text-lg block">Books</span>
            <span className="text-xs text-muted mt-1 block">Published &amp; forthcoming</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
