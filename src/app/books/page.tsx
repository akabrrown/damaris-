import React from 'react';
import { Metadata } from 'next';
import { getPublishedBooks } from '@/lib/queries';
import { BookCard } from '@/components/book-card';

export const metadata: Metadata = {
  title: 'Books',
  description: 'Books published and in progress.',
};

export const dynamic = 'force-dynamic';

export default async function BooksPage() {
  const books = await getPublishedBooks();

  return (
    <div className="py-4 sm:py-8">
      {/* Header */}
      <header className="mb-10 sm:mb-14 max-w-[760px]">
        <div className="w-12 h-1 bg-sage mb-4" aria-hidden="true" />
        <h1 className="font-serif text-3xl sm:text-5xl text-ink font-normal tracking-tight">
          Books
        </h1>
        <p className="font-serif text-lg sm:text-xl text-muted font-normal mt-3 leading-relaxed">
          Published collections, chapbooks, and titles currently in progress.
        </p>
      </header>

      {/* Grid of Books */}
      {books.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border-y border-line/40 my-8">
          <p className="font-serif italic text-xl text-muted">
            No published books yet. Works are currently in progress.
          </p>
        </div>
      )}
    </div>
  );
}
