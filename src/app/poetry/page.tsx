import React from 'react';
import { Metadata } from 'next';
import { SectionIndex } from '@/components/section-index';

export const metadata: Metadata = {
  title: 'Poetry',
  description: 'Poems, verses, and lyrical lines.',
};

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ cursor?: string }>;
}

export default async function PoetryPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <SectionIndex
      kind="poem"
      title="Poetry"
      description="Lines written in quiet moments, held together by rhythm and space."
      cursor={params.cursor}
    />
  );
}
