import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BookEditor } from '@/components/book-editor';

export default async function NewBookPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/admin/login');

  const { count: confirmedCount } = await supabase
    .from('subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed');

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink font-normal tracking-tight mb-6">
        Add New Book
      </h1>
      <BookEditor confirmedSubscribersCount={confirmedCount || 0} />
    </div>
  );
}
