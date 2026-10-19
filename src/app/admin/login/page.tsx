'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    startTransition(async () => {
      const supabase = createClient();

      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
          },
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          setInfoMsg('Check your email for the magic sign-in link.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg('Could not sign in with those details. Please check your credentials.');
        } else {
          router.push('/admin');
          router.refresh();
        }
      }
    });
  };

  return (
    <div className="max-w-[440px] mx-auto py-16 sm:py-24">
      <div className="border border-line bg-paper p-8 shadow-xs">
        <div className="w-12 h-1 bg-sage mb-6" aria-hidden="true" />
        <h1 className="font-serif text-3xl text-ink font-normal tracking-tight mb-2">
          Author Sign In
        </h1>
        <p className="text-sm text-muted mb-6">
          Private administration area for Caroline Damaris Donkor.
        </p>

        {errorMsg && (
          <div role="alert" className="p-3 mb-4 bg-paper-deep border border-alert text-alert text-sm">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div role="status" className="p-3 mb-4 bg-sage-soft border border-line text-ink text-sm">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="admin-email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-paper border border-ink text-ink text-base rounded-none focus:outline-2 focus:outline-moss"
              placeholder="author@example.com"
            />
          </div>

          {mode === 'password' && (
            <div>
              <label htmlFor="admin-pass" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
                Password
              </label>
              <input
                type="password"
                id="admin-pass"
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-paper border border-ink text-ink text-base rounded-none focus:outline-2 focus:outline-moss"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-sage hover:bg-sage/80 border border-ink text-ink font-medium text-base transition-colors cursor-pointer disabled:opacity-60"
          >
            {isPending ? 'Signing in…' : mode === 'magic' ? 'Send Magic Link' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-line text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'password' ? 'magic' : 'password');
              setErrorMsg('');
              setInfoMsg('');
            }}
            className="text-xs text-moss hover:text-ink underline underline-offset-2"
          >
            {mode === 'password' ? 'Sign in with email magic link instead' : 'Sign in with password instead'}
          </button>
        </div>
      </div>
    </div>
  );
}
