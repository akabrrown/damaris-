import React from 'react';
import { Metadata } from 'next';
import { SectionIndex } from '@/components/section-index';

export const metadata: Metadata = {
  title: 'Short Stories',
  description: 'Short fiction and narratives.',
};

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ cursor?: string }>;
}

export default async function StoriesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <SectionIndex
      kind="story"
      title="Short Stories"
      cursor={params.cursor}
    />
  );
}
