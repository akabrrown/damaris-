'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Post, PostKind } from '@/lib/types';
import { calculateReadingTime } from '@/lib/reading-time';
import { getPiecePath } from '@/lib/routing';
import { ArrowUpRight, BookOpen, Feather, Quote as QuoteIcon, Sparkles } from 'lucide-react';

interface RecentWritingShowcaseProps {
  posts: Post[];
}

type FilterKind = 'all' | PostKind;

const KIND_METADATA: Record<PostKind, { label: string; singular: string; plural: string; icon: React.ComponentType<{ className?: string }> }> = {
  poem: { label: 'Poetry', singular: 'poem', plural: 'poems', icon: Feather },
  story: { label: 'Stories', singular: 'story', plural: 'stories', icon: BookOpen },
  reflection: { label: 'Reflections', singular: 'reflection', plural: 'reflections', icon: Sparkles },
  quote: { label: 'Quotes', singular: 'quote', plural: 'quotes', icon: QuoteIcon },
};

export function RecentWritingShowcase({ posts }: RecentWritingShowcaseProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKind>('all');

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'all') return posts;
    return posts.filter((p) => p.kind === activeFilter);
  }, [posts, activeFilter]);

  const counts = useMemo(() => {
    return {
      all: posts.length,
      poem: posts.filter((p) => p.kind === 'poem').length,
      story: posts.filter((p) => p.kind === 'story').length,
      reflection: posts.filter((p) => p.kind === 'reflection').length,
      quote: posts.filter((p) => p.kind === 'quote').length,
    };
  }, [posts]);

  // Lead piece (first piece) and secondary pieces
  const [leadPiece, ...gridPieces] = filteredPosts;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <section aria-labelledby="recent-heading" className="space-y-8">
      {/* Section Header & Pinterest-style Genre Pills */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-line pb-6">
        <div>
          <div className="w-10 h-0.5 bg-sage mb-3" aria-hidden="true" />
          <h2 id="recent-heading" className="font-serif text-3xl sm:text-4xl text-ink font-normal tracking-tight">
            Recent writing
          </h2>
          <p className="font-serif text-base sm:text-lg text-muted mt-1 italic">
            Curated poems, stories, fragments, and personal essays.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter writing by kind">
          <button
            type="button"
            role="tab"
            aria-selected={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 text-xs font-sans uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-sage border border-ink text-ink font-semibold shadow-2xs'
                : 'border border-line/80 bg-paper hover:bg-paper-deep text-muted hover:text-ink'
            }`}
          >
            All <span className="text-[10px] opacity-75 ml-1">({counts.all})</span>
          </button>

          {(['poem', 'story', 'reflection', 'quote'] as PostKind[]).map((kind) => {
            const meta = KIND_METADATA[kind];
            const isSelected = activeFilter === kind;
            return (
              <button
                key={kind}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveFilter(kind)}
                className={`px-3.5 py-1.5 text-xs font-sans uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-sage border border-ink text-ink font-semibold shadow-2xs'
                    : 'border border-line/80 bg-paper hover:bg-paper-deep text-muted hover:text-ink'
                }`}
              >
                {meta.label} <span className="text-[10px] opacity-75 ml-1">({counts[kind]})</span>
              </button>
            );
          })}
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-line bg-paper-deep/30 px-6">
          <p className="font-serif italic text-xl text-muted">
            {activeFilter === 'all'
              ? 'Nothing here yet. The first piece is on its way.'
              : `No ${KIND_METADATA[activeFilter].plural} published yet. The next piece is taking shape.`}
          </p>
          {activeFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className="mt-4 px-4 py-2 border border-line bg-paper hover:bg-paper-deep text-xs uppercase tracking-wider text-ink transition-colors cursor-pointer"
            >
              View all writing
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Featured Lead Editorial Card */}
          {leadPiece && (
            <article className="border border-ink bg-sage hover:bg-sage/85 text-ink transition-all duration-300 relative group p-6 sm:p-10 shadow-xs">
              <Link
                href={getPiecePath(leadPiece.kind, leadPiece.slug)}
                className="block focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-4"
              >
                {/* Meta Badge Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-wider text-ink/80 mb-4 pb-3 border-b border-ink/20">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-paper border border-ink text-ink text-[10px] font-sans font-semibold tracking-widest uppercase">
                      {KIND_METADATA[leadPiece.kind].singular}
                    </span>
                    <span className="text-ink/40" aria-hidden="true">&bull;</span>
                    <span className="text-ink/80 font-medium">Featured piece</span>
                  </div>
                  <div className="flex items-center space-x-3 text-ink/80 font-medium">
                    <time dateTime={leadPiece.published_at || ''}>{formatDate(leadPiece.published_at)}</time>
                    {(leadPiece.kind === 'story' || leadPiece.kind === 'reflection') && (
                      <>
                        <span aria-hidden="true">&bull;</span>
                        <span>{calculateReadingTime(leadPiece.body_md)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="max-w-[760px] space-y-4">
                  <h3 className="font-serif text-2xl sm:text-4xl text-ink font-normal leading-tight tracking-tight group-hover:underline group-hover:underline-offset-4 transition-all">
                    {leadPiece.title}
                  </h3>

                  {leadPiece.kind === 'quote' ? (
                    <blockquote className="font-serif italic text-xl sm:text-2xl text-ink leading-relaxed my-4">
                      &ldquo;{leadPiece.body_md}&rdquo;
                    </blockquote>
                  ) : (
                    <p className="font-serif italic text-xl sm:text-2xl text-ink leading-relaxed my-3 line-clamp-3">
                      &ldquo;{leadPiece.excerpt || leadPiece.body_md.slice(0, 200)}&hellip;&rdquo;
                    </p>
                  )}
                </div>

                {/* Read Action */}
                <div className="mt-6 pt-4 border-t border-ink/20 flex items-center justify-between text-sm font-medium text-ink">
                  <span className="inline-flex items-center gap-1.5 group-hover:underline font-serif italic text-base">
                    Read <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </article>
          )}

          {/* Pinterest-style Masonry / Editorial Cards Grid */}
          {gridPieces.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridPieces.map((piece) => {
                const href = getPiecePath(piece.kind, piece.slug);
                const readingTime = (piece.kind === 'story' || piece.kind === 'reflection')
                  ? calculateReadingTime(piece.body_md)
                  : null;

                return (
                  <article
                    key={piece.id}
                    className="border border-ink bg-sage hover:bg-sage/85 text-ink p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 hover:shadow-xs"
                  >
                    <Link
                      href={href}
                      className="block focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-4 flex-1 flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Category Tag + Date */}
                        <div className="flex items-center justify-between text-xs uppercase tracking-wider text-ink/80 mb-3 pb-2 border-b border-ink/20">
                          <span className="inline-flex items-center px-2 py-0.5 bg-paper border border-ink text-ink text-[10px] font-semibold tracking-widest">
                            {piece.kind}
                          </span>
                          <time dateTime={piece.published_at || ''} className="text-[11px] font-medium">
                            {formatDate(piece.published_at)}
                          </time>
                        </div>

                        {/* Title */}
                        <h3 className="font-serif text-xl sm:text-2xl text-ink font-normal leading-snug mb-3 group-hover:underline group-hover:underline-offset-2 transition-all">
                          {piece.title}
                        </h3>

                        {/* Excerpt by Kind */}
                        {piece.kind === 'quote' ? (
                          <blockquote className="font-serif italic text-xl sm:text-2xl text-ink leading-relaxed my-3">
                            &ldquo;{piece.body_md}&rdquo;
                          </blockquote>
                        ) : piece.kind === 'poem' ? (
                          <div className="font-serif italic text-xl sm:text-2xl text-ink leading-relaxed mb-3 whitespace-pre-line">
                            &ldquo;{piece.excerpt || piece.body_md.split('\n').slice(0, 3).join('\n')}&rdquo;
                          </div>
                        ) : (
                          <p className="font-serif italic text-xl sm:text-2xl text-ink leading-relaxed mb-3 line-clamp-3">
                            &ldquo;{piece.excerpt || piece.body_md.slice(0, 160)}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Footer Info */}
                      <div className="mt-4 pt-3 border-t border-ink/20 flex items-center justify-between text-xs text-ink/80 font-medium">
                        <span>{readingTime || (piece.attribution ? `— ${piece.attribution}` : null)}</span>
                        <span className="inline-flex items-center text-ink group-hover:underline font-medium">
                          Read &rarr;
                        </span>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
