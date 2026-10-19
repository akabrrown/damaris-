'use client';

import React, { Suspense, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ConfirmSubscriptionContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'expired' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleConfirm = () => {
    if (!token) {
      setStatus('error');
      setMessage('No confirmation token provided. Please check the link from your email.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/subscribe/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.status === 410) {
          setStatus('expired');
          setMessage('This confirmation link has expired. Enter your email again and we will send a new one.');
          return;
        }

        if (!res.ok) {
          setStatus('error');
          setMessage(data.detail || 'This confirmation link is invalid or has already been used.');
          return;
        }

        setStatus('success');
        setMessage(data.message || 'You are subscribed. Thank you for reading.');
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
        Confirm your subscription
      </h1>

      {status === 'idle' && (
        <div className="space-y-6">
          <p className="font-serif italic text-lg text-muted leading-relaxed">
            Please press the button below to confirm that you wish to receive new writing by email.
          </p>

          <div>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending || !token}
              className="px-8 py-4 bg-sage hover:bg-sage/80 border border-ink text-ink font-medium text-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? 'Confirming…' : 'Confirm Subscription'}
            </button>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="p-6 bg-sage-soft border border-line text-ink text-left space-y-4">
          <p className="font-serif text-xl">{message}</p>
          <p className="text-sm text-muted">
            You will now receive a quiet email whenever something new is published.
          </p>
          <div className="pt-2">
            <Link href="/" className="text-moss underline underline-offset-4 text-sm font-medium">
              &larr; Return to Home
            </Link>
          </div>
        </div>
      )}

      {status === 'expired' && (
        <div className="p-6 bg-paper-deep border border-line text-left space-y-4">
          <p className="font-serif text-xl text-alert">{message}</p>
          <div>
            <Link href="/" className="text-moss underline underline-offset-4 text-sm font-medium">
              &larr; Enter your email on the Home page
            </Link>
          </div>
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

export default function ConfirmSubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[560px] mx-auto py-12 sm:py-20 text-center">
          <p className="font-serif italic text-muted">Loading confirmation details…</p>
        </div>
      }
    >
      <ConfirmSubscriptionContent />
    </Suspense>
  );
}
