import React from 'react';
import { Metadata } from 'next';
import { SectionIndex } from '@/components/section-index';

export const metadata: Metadata = {
  title: 'Quotes',
  description: 'Lines and fragments to remember.',
};

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ cursor?: string }>;
}

export default async function QuotesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <SectionIndex
      kind="quote"
      title="Quotes"
      cursor={params.cursor}
    />
  );
}
