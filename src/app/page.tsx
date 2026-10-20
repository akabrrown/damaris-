import React from 'react';
import Link from 'next/link';
import { getSiteSettings, getRecentPosts } from '@/lib/queries';
import { RecentWritingShowcase } from '@/components/recent-writing-showcase';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [settings, recentPosts] = await Promise.all([
    getSiteSettings(),
    getRecentPosts(12),
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

      {/* Recent Writing Showcase */}
      <RecentWritingShowcase posts={recentPosts} />

      {/* Sections Overview Links */}
      <section aria-labelledby="sections-heading" className="pt-8 border-t border-line">
        <h2 id="sections-heading" className="text-xs uppercase tracking-wider text-muted font-semibold mb-6">
          Explore by section
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <Link
            href="/poetry"
            className="p-4 border border-line bg-paper hover:bg-paper-deep text-ink transition-colors block text-center"
          >
            <span className="font-serif text-lg block">Poetry</span>
          </Link>
          <Link
            href="/stories"
            className="p-4 border border-line bg-paper hover:bg-paper-deep text-ink transition-colors block text-center"
          >
            <span className="font-serif text-lg block">Stories</span>
          </Link>
          <Link
            href="/reflections"
            className="p-4 border border-line bg-paper hover:bg-paper-deep text-ink transition-colors block text-center"
          >
            <span className="font-serif text-lg block">Reflections</span>
          </Link>
          <Link
            href="/quotes"
            className="p-4 border border-line bg-paper hover:bg-paper-deep text-ink transition-colors block text-center"
          >
            <span className="font-serif text-lg block">Quotes</span>
          </Link>
          <Link
            href="/books"
            className="p-4 border border-line bg-paper hover:bg-paper-deep text-ink transition-colors block text-center"
          >
            <span className="font-serif text-lg block">Books</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
