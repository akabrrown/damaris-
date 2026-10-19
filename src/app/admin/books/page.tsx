import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminBooksListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/admin/login');

  const { data: books } = await supabase
    .from('books')
    .select('id, slug, title, subtitle, cover_path, cover_alt, progress, status, sort_order, updated_at')
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="font-serif text-3xl text-ink font-normal tracking-tight">
            Books
          </h1>
          <p className="text-sm text-muted">
            Manage your books, covers, synopses, and publication statuses.
          </p>
        </div>

        <Link
          href="/admin/books/new"
          className="px-5 py-2.5 bg-sage hover:bg-sage/80 border border-ink text-ink font-medium text-sm transition-colors"
        >
          + Add New Book
        </Link>
      </div>

      {books && books.length > 0 ? (
        <div className="border border-line bg-paper divide-y divide-line/60">
          {books.map((b) => (
            <div key={b.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative w-12 h-16 bg-paper-deep border border-line flex-shrink-0 overflow-hidden">
                  {b.cover_path ? (
                    <Image
                      src={b.cover_path}
                      alt={b.cover_alt || b.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-muted text-center p-1">
                      No cover
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2 text-xs uppercase tracking-wider text-muted mb-1">
                    <span className="font-semibold">{b.progress}</span>
                    <span>&middot;</span>
                    <span>{b.status}</span>
                    <span>&middot;</span>
                    <span>Order: {b.sort_order}</span>
                  </div>
                  <Link
                    href={`/admin/books/${b.id}`}
                    className="font-serif text-xl text-ink font-normal hover:text-moss hover:underline"
                  >
                    {b.title}
                  </Link>
                  {b.subtitle && <p className="text-xs text-muted mt-0.5">{b.subtitle}</p>}
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                {b.status === 'published' && (
                  <Link
                    href={`/books/${b.slug}`}
                    target="_blank"
                    className="text-moss hover:text-ink underline"
                  >
                    View &rarr;
                  </Link>
                )}
                <Link
                  href={`/admin/books/${b.id}`}
                  className="px-3 py-1 bg-sage/60 hover:bg-sage border border-ink text-ink font-medium"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center border border-line bg-paper">
          <p className="font-serif italic text-lg text-muted">
            No books created yet. Click &ldquo;+ Add New Book&rdquo; to begin.
          </p>
        </div>
      )}
    </div>
  );
}
