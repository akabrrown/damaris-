import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Book } from '@/lib/types';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const statusLabels: Record<string, string> = {
    available: 'Available Now',
    in_progress: 'In Progress',
    upcoming: 'Upcoming',
  };

  return (
    <article className="group flex flex-col h-full border border-line bg-paper p-4 sm:p-5">
      <Link href={`/books/${book.slug}`} className="block focus-visible:outline-2 focus-visible:outline-moss focus-visible:outline-offset-4 mb-4 flex-1">
        {/* Book Cover or Placeholder */}
        <div className="relative aspect-[2/3] w-full bg-sage/20 border border-line overflow-hidden mb-4 flex items-center justify-center p-4 text-center">
          {book.cover_path ? (
            <Image
              src={book.cover_path}
              alt={book.cover_alt || `Book cover for ${book.title}`}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-200"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4">
              <span className="font-serif text-lg sm:text-xl text-ink font-normal">{book.title}</span>
              {book.subtitle && <span className="text-xs text-muted mt-2">{book.subtitle}</span>}
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="text-xs uppercase tracking-wider text-muted font-medium mb-1">
          {statusLabels[book.progress] || book.progress}
        </div>

        {/* Title */}
        <h2 className="font-serif text-xl sm:text-2xl font-normal text-ink group-hover:text-moss transition-colors">
          {book.title}
        </h2>

        {/* Synopsis snippet */}
        <p className="text-sm text-muted mt-2 line-clamp-3 leading-relaxed">
          {book.synopsis_md}
        </p>
      </Link>

      {/* Outbound Link or Details */}
      <div className="pt-3 border-t border-line/60 flex items-center justify-between text-sm">
        <Link
          href={`/books/${book.slug}`}
          className="text-moss hover:text-ink underline underline-offset-2 font-medium min-h-[44px] inline-flex items-center"
        >
          Details &amp; Excerpt &rarr;
        </Link>

        {book.progress === 'available' && book.purchase_url && (
          <a
            href={book.purchase_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-sage border border-ink text-ink text-xs font-medium hover:bg-sage/80 transition-colors inline-flex items-center min-h-[36px]"
          >
            Buy / Read
          </a>
        )}
      </div>
    </article>
  );
}
