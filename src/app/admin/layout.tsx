import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is not authenticated, let them view /admin/login but block protected admin routes
  // (In Next.js App Router, layout handles subroutes)

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {user && (
        <header className="bg-paper-deep border-b border-line px-4 sm:px-8 py-3 sticky top-0 z-40">
          <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-6">
              <Link href="/admin" className="font-serif text-xl text-ink font-semibold">
                Admin
              </Link>

              <nav className="flex items-center space-x-4 text-sm font-medium">
                <Link href="/admin" className="text-muted hover:text-ink py-1">
                  Dashboard
                </Link>
                <Link href="/admin/posts" className="text-muted hover:text-ink py-1">
                  Writing
                </Link>
                <Link href="/admin/books" className="text-muted hover:text-ink py-1">
                  Books
                </Link>
                <Link href="/admin/about" className="text-muted hover:text-ink py-1">
                  Settings
                </Link>
                <Link href="/admin/subscribers" className="text-muted hover:text-ink py-1">
                  Subscribers
                </Link>
                <Link href="/admin/notifications" className="text-muted hover:text-ink py-1">
                  Notifications
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4 text-xs">
              <Link href="/" target="_blank" className="text-moss hover:text-ink underline">
                View live site &rarr;
              </Link>
              <form action="/auth/signout" method="POST">
                <button type="submit" className="text-muted hover:text-alert cursor-pointer">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}
