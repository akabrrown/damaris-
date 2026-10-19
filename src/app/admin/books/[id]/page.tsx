import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BookEditor } from '@/components/book-editor';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBookPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/admin/login');

  const [{ data: book }, { count: confirmedCount }] = await Promise.all([
    supabase.from('books').select('*').eq('id', id).single(),
    supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
  ]);

  if (!book) notFound();

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink font-normal tracking-tight mb-6">
        Edit Book &ldquo;{book.title}&rdquo;
      </h1>
      <BookEditor
        initialBook={book}
        confirmedSubscribersCount={confirmedCount || 0}
      />
    </div>
  );
}
