'use client';

import React, { Suspense, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('t') || '';

  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleUnsubscribe = () => {
    if (!token) {
      setStatus('error');
      setMessage('No unsubscribe token was provided. Please check the link from your email.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/unsubscribe?t=${encodeURIComponent(token)}`, {
          method: 'POST',
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setStatus('error');
          setMessage(data.detail || 'This unsubscribe link is invalid or has already been processed.');
          return;
        }

        setStatus('success');
        setMessage(data.message || 'You have been unsubscribed and will not receive further emails.');
      } catch {
        setStatus('error');
        setMessage('Network error. Please check your connection and try again.');
      }
    });
  };

  return (
    <div className="max-w-[560px] mx-auto py-12 sm:py-20 text-center">
      <div className="w-12 h-1 bg-sage mx-auto mb-6" aria-hidden="true" />
      <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal mb-4 tracking-tight">
        Unsubscribe from updates
      </h1>

      {status === 'idle' && (
        <div className="space-y-6">
          <p className="font-serif italic text-lg text-muted leading-relaxed">
            Please press the button below if you wish to stop receiving updates when new pieces are published.
          </p>

          <div>
            <button
              type="button"
              onClick={handleUnsubscribe}
              disabled={isPending || !token}
              className="px-8 py-4 bg-paper-deep hover:bg-paper-deep/80 border border-ink text-ink font-medium text-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? 'Unsubscribing…' : 'Unsubscribe'}
            </button>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="p-6 bg-sage-soft border border-line text-ink text-left space-y-4">
          <p className="font-serif text-xl">{message}</p>
          <p className="text-sm text-muted">
            Changed your mind? You can{' '}
            <Link href="/" className="text-moss underline underline-offset-4">
              subscribe again
            </Link>{' '}
            at any time.
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="p-6 bg-paper-deep border border-line text-left space-y-4">
          <p className="font-serif text-xl text-alert">{message}</p>
          <div>
            <Link href="/" className="text-moss underline underline-offset-4 text-sm font-medium">
              &larr; Return to Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[560px] mx-auto py-12 sm:py-20 text-center">
          <p className="font-serif italic text-muted">Loading unsubscribe details…</p>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
