'use client';

import React, { useState, useTransition } from 'react';

interface SubscribeFormProps {
  layout?: 'panel' | 'compact';
  heading?: string;
  helper?: string;
}

export function SubscribeForm({
  layout = 'panel',
  heading = 'New writing, by email.',
  helper = 'Just your email address. One message when something new is published. Unsubscribe any time.',
}: SubscribeFormProps) {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('That does not look like an email address.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, website: honeypot }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.status === 429) {
          setStatus('error');
          setMessage('Too many tries. Please wait a few minutes and try again.');
          return;
        }

        if (!res.ok) {
          setStatus('error');
          setMessage(data.detail || 'Something went wrong on our side and your address was not saved. Please try again.');
          return;
        }

        setStatus('success');
        setMessage('Almost there. Check your inbox and press the confirmation link. If it is not there in a few minutes, look in spam.');
        setEmail('');
      } catch {
        setStatus('error');
        setMessage('Network error. Please check your connection and try again.');
      }
    });
  };

  const isPanel = layout === 'panel';

  return (
    <div
      className={
        isPanel
          ? 'bg-sage/30 border border-line p-6 sm:p-8 my-8'
          : 'pt-6 border-t border-line my-6'
      }
    >
      {heading && (
        <h3 className="font-serif text-xl sm:text-2xl text-ink font-normal mb-2">
          {heading}
        </h3>
      )}
      {helper && <p className="text-sm text-muted mb-4 max-w-xl">{helper}</p>}

      {status === 'success' ? (
        <div
          role="status"
          className="p-4 bg-sage-soft border border-line text-ink text-sm leading-relaxed"
        >
          {message}
        </div>
      ) : (
        <form
          action="/api/subscribe"
          method="POST"
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-2 max-w-lg"
          noValidate
        >
          {/* Honeypot field (threat T1 / T2) */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="flex-1">
            <label htmlFor="subscribe-email" className="sr-only">
              Email address
            </label>
            <input
              type="email"
              id="subscribe-email"
              name="email"
              required
              placeholder="Your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === 'error') setStatus('idle');
              }}
              disabled={isPending}
              className="w-full px-4 py-3 bg-paper border border-ink text-ink placeholder:text-muted/70 text-base rounded-none focus:outline-2 focus:outline-moss"
              aria-describedby={status === 'error' ? 'subscribe-error' : undefined}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 bg-sage hover:bg-sage/80 border border-ink text-ink font-medium text-base rounded-none transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isPending ? 'Sending…' : 'Subscribe'}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p
          id="subscribe-error"
          role="alert"
          className="mt-2 text-sm text-alert"
        >
          {message}
        </p>
      )}

      <p className="mt-3 text-xs text-muted">
        <a href="/privacy" className="text-moss underline underline-offset-2">
          Privacy Notice
        </a>{' '}
        &middot; No spam, ever.
      </p>
    </div>
  );
}
