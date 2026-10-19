import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-[62ch] mx-auto py-16 sm:py-24 text-center">
      <div className="w-12 h-1 bg-sage mx-auto mb-6" aria-hidden="true" />
      <span className="text-xs uppercase tracking-wider text-muted font-medium">404 &middot; Not Found</span>
      <h1 className="font-serif text-3xl sm:text-5xl text-ink font-normal mt-3 mb-6 tracking-tight">
        This piece could not be found.
      </h1>
      <p className="font-serif italic text-lg sm:text-xl text-muted leading-relaxed mb-10">
        It may have been moved, unpublished, or the link may have been mistyped.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
        <Link
          href="/"
          className="px-6 py-3 bg-sage border border-ink text-ink hover:bg-sage/80 transition-colors"
        >
          Return Home
        </Link>
        <Link
          href="/poetry"
          className="px-6 py-3 border border-line bg-paper hover:bg-paper-deep text-ink transition-colors"
        >
          Browse Poetry
        </Link>
        <Link
          href="/stories"
          className="px-6 py-3 border border-line bg-paper hover:bg-paper-deep text-ink transition-colors"
        >
          Browse Stories
        </Link>
      </div>
    </div>
  );
}
