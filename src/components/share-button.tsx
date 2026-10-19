'use client';

import React, { useState } from 'react';

interface ShareButtonProps {
  title: string;
  url?: string;
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        });
        return;
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          // Fall back to copy
        } else {
          return;
        }
      }
    }

    // Fallback: Copy link
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback failed
    }
  };

  return (
    <div className="inline-flex items-center">
      <button
        type="button"
        onClick={handleShare}
        className="text-sm font-medium text-moss hover:text-ink underline underline-offset-4 py-2 px-1 min-h-[44px] inline-flex items-center cursor-pointer transition-colors"
        aria-label={`Share or copy link to ${title}`}
      >
        {copied ? 'Link copied to clipboard' : 'Share this piece'}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? 'Link copied to clipboard' : ''}
      </span>
    </div>
  );
}
