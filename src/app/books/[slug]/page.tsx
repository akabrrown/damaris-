import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Metadata } from 'next';
import { getBookBySlug } from '@/lib/queries';
import { sanitizeMarkdown } from '@/lib/content-renderer';
import { ShareButton } from '@/components/share-button';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return { title: 'Book Not Found' };

  return {
    title: book.title,
    description: book.subtitle || book.synopsis_md.slice(0, 150),
  };
}

export default async function BookDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) {
    notFound();
  }

  const synopsisHtml = sanitizeMarkdown(book.synopsis_md);
  const excerptHtml = book.excerpt_md ? sanitizeMarkdown(book.excerpt_md) : null;

  const statusLabels: Record<string, string> = {
    available: 'Available Now',
    in_progress: 'In Progress',
    upcoming: 'Upcoming',
  };

  return (
    <article className="max-w-[880px] mx-auto py-6 sm:py-12">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
        {/* Book Cover Column */}
        <div className="md:col-span-5">
          <div className="relative aspect-[2/3] w-full max-w-[340px] mx-auto md:mx-0 border border-line bg-paper-deep overflow-hidden">
            {book.cover_path ? (
              <Image
                src={book.cover_path}
                alt={book.cover_alt || `Book cover for ${book.title}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 340px"
                priority
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                <span className="font-serif text-2xl text-ink font-normal">{book.title}</span>
                {book.subtitle && <span className="text-sm text-muted mt-2">{book.subtitle}</span>}
              </div>
            )}
          </div>

          {/* Action buttons under cover */}
          <div className="mt-6 flex flex-col gap-3 max-w-[340px] mx-auto md:mx-0">
            {book.progress === 'available' && book.purchase_url ? (
              <a
                href={book.purchase_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-sage hover:bg-sage/80 border border-ink text-ink font-medium text-center text-base transition-colors inline-block"
              >
                Buy or Read Online &rarr;
              </a>
            ) : (
              <div className="p-3 bg-paper-deep border border-line text-xs text-muted text-center uppercase tracking-wider">
                {book.progress === 'upcoming' && book.release_date
                  ? `Expected: ${book.release_date}`
                  : statusLabels[book.progress] || book.progress}
              </div>
            )}

            <div className="pt-2 text-center">
              <ShareButton title={book.title} />
            </div>
          </div>
        </div>

        {/* Book Details Column */}
        <div className="md:col-span-7">
          <div className="text-xs uppercase tracking-wider text-muted font-medium mb-2">
            <span>{statusLabels[book.progress] || book.progress}</span>
            {book.release_date && <span> &middot; {book.release_date}</span>}
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl text-ink font-normal tracking-tight leading-tight">
            {book.title}
          </h1>

          {book.subtitle && (
            <p className="font-serif italic text-xl text-muted mt-2">
              {book.subtitle}
            </p>
          )}

          {/* Synopsis */}
          <div className="mt-8 pt-6 border-t border-line">
            <h2 className="text-xs uppercase tracking-wider text-muted font-semibold mb-4">
              Synopsis
            </h2>
            <div
              className="prose-reading text-base sm:text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: synopsisHtml }}
            />
          </div>

          {/* Excerpt Section (if available) */}
          {excerptHtml && (
            <div className="mt-10 pt-6 border-t border-line">
              <h2 className="text-xs uppercase tracking-wider text-muted font-semibold mb-4">
                Excerpt
              </h2>
              <div
                className="prose-reading text-base sm:text-lg leading-relaxed bg-paper-deep p-6 border border-line/60"
                dangerouslySetInnerHTML={{ __html: excerptHtml }}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
