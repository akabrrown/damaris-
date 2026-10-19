'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log structured error for observability
    console.error('Unhandled runtime error:', error);
  }, [error]);

  return (
    <div className="max-w-[62ch] mx-auto py-16 sm:py-24 text-center">
      <div className="w-12 h-1 bg-alert mx-auto mb-6" aria-hidden="true" />
      <span className="text-xs uppercase tracking-wider text-alert font-medium">An error occurred</span>
      <h1 className="font-serif text-3xl sm:text-5xl text-ink font-normal mt-3 mb-6 tracking-tight">
        Something went wrong on our side.
      </h1>
      <p className="font-serif italic text-lg sm:text-xl text-muted leading-relaxed mb-10">
        We encountered an unexpected problem while rendering this page.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
        <button
          type="button"
          onClick={() => reset()}
          className="px-6 py-3 bg-sage border border-ink text-ink hover:bg-sage/80 transition-colors cursor-pointer"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-6 py-3 border border-line bg-paper hover:bg-paper-deep text-ink transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
