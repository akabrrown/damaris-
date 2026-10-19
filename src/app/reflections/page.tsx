import React from 'react';
import { Metadata } from 'next';
import { SectionIndex } from '@/components/section-index';

export const metadata: Metadata = {
  title: 'Reflections',
  description: 'Essays, personal thoughts, and notes on reading and living.',
};

export const revalidate = 3600;

interface PageProps {
  searchParams: Promise<{ cursor?: string }>;
}

export default async function ReflectionsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <SectionIndex
      kind="reflection"
      title="Reflections"
      description="Essays, personal observations, and notes on reading and living."
      cursor={params.cursor}
    />
  );
}
