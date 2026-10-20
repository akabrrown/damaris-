import React from 'react';
import Link from 'next/link';
import { PostKind } from '@/lib/schemas';
import { getPostsByKind } from '@/lib/queries';
import { getSectionPath } from '@/lib/routing';
import { EntryRow } from './entry-row';

interface SectionIndexProps {
  kind: PostKind;
  title: string;
  description?: string;
  cursor?: string;
}

export async function SectionIndex({ kind, title, description, cursor }: SectionIndexProps) {
  const { items, nextCursor } = await getPostsByKind(kind, cursor);
  const basePath = getSectionPath(kind);


  return (
    <div className="max-w-[760px] mx-auto py-4 sm:py-8">
      {/* Section Header */}
      <header className="mb-10 sm:mb-14">
        <div className="w-12 h-1 bg-sage mb-4" aria-hidden="true" />
        <h1 className="font-serif text-3xl sm:text-5xl text-ink font-normal tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="font-serif text-lg sm:text-xl text-muted font-normal mt-3 leading-relaxed">
            {description}
          </p>
        )}
      </header>

      {/* List of Pieces */}
      {items.length > 0 ? (
        <div className="divide-y divide-line/60">
          {items.map((post) => (
            <EntryRow key={post.id} post={post} showKindLabel={false} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border-y border-line/40 my-8">
          <p className="font-serif italic text-xl text-muted">
            Nothing here yet. The first piece is on its way.
          </p>
        </div>
      )}

      {/* Pager: Older / Newer text links */}
      <nav aria-label="Pagination" className="mt-12 pt-6 border-t border-line flex items-center justify-between">
        <div>
          {cursor ? (
            <Link
              href={basePath}
              className="text-sm font-medium text-moss hover:text-ink underline underline-offset-4 min-h-[44px] inline-flex items-center"
            >
              &larr; Newest pieces
            </Link>
          ) : (
            <span className="text-xs text-muted/50 uppercase tracking-wider">Viewing newest</span>
          )}
        </div>

        <div>
          {nextCursor ? (
            <Link
              href={`${basePath}?cursor=${encodeURIComponent(nextCursor)}`}
              className="text-sm font-medium text-moss hover:text-ink underline underline-offset-4 min-h-[44px] inline-flex items-center"
            >
              Older pieces &rarr;
            </Link>
          ) : (
            items.length > 0 && (
              <span className="text-xs text-muted/50 uppercase tracking-wider">End of list</span>
            )
          )}
        </div>
      </nav>
    </div>
  );
}
