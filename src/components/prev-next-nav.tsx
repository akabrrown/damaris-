import React from 'react';
import Link from 'next/link';

interface NavItem {
  title: string | null;
  slug: string;
  kind: string;
}

interface PrevNextNavProps {
  prev: NavItem | null;
  next: NavItem | null;
  sectionLabel: string;
}

export function PrevNextNav({ prev, next, sectionLabel }: PrevNextNavProps) {
  if (!prev && !next) return null;

  const getHref = (item: NavItem) =>
    `/${item.kind === 'story' ? 'stories' : item.kind === 'reflection' ? 'reflections' : item.kind}/${item.slug}`;

  return (
    <nav aria-label={`More ${sectionLabel}`} className="mt-12 pt-8 border-t border-line grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div>
        {prev ? (
          <Link href={getHref(prev)} className="group block focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-4">
            <span className="text-xs uppercase tracking-wider text-muted">&larr; Older</span>
            <p className="font-serif text-lg text-ink font-normal group-hover:text-moss group-hover:underline group-hover:underline-offset-2 transition-colors mt-1 line-clamp-1">
              {prev.title || 'Untitled'}
            </p>
          </Link>
        ) : (
          <div className="text-xs text-muted/50 uppercase tracking-wider">&larr; First in this section</div>
        )}
      </div>

      <div className="sm:text-right">
        {next ? (
          <Link href={getHref(next)} className="group block focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-4">
            <span className="text-xs uppercase tracking-wider text-muted">Newer &rarr;</span>
            <p className="font-serif text-lg text-ink font-normal group-hover:text-moss group-hover:underline group-hover:underline-offset-2 transition-colors mt-1 line-clamp-1">
              {next.title || 'Untitled'}
            </p>
          </Link>
        ) : (
          <div className="text-xs text-muted/50 uppercase tracking-wider">Latest piece &rarr;</div>
        )}
      </div>
    </nav>
  );
}
