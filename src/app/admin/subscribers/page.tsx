import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DeleteSubscriberButton } from '@/components/delete-subscriber-button';

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function AdminSubscribersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/admin/login');

  // Load counts
  const [
    { count: confirmedCount },
    { count: pendingCount },
    { count: unsubscribedCount },
    { count: bouncedCount },
  ] = await Promise.all([
    supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('status', 'unsubscribed'),
    supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('status', 'bounced'),
  ]);

  let query = supabase
    .from('subscribers')
    .select('id, email, status, consented_at, confirmed_at, unsubscribed_at, source')
    .order('created_at', { ascending: false });

  if (params.status && ['pending', 'confirmed', 'unsubscribed', 'bounced'].includes(params.status)) {
    query = query.eq('status', params.status);
  }

  if (params.q) {
    query = query.ilike('email', `%${params.q.trim()}%`);
  }

  const { data: subscribers } = await query.limit(100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="font-serif text-3xl text-ink font-normal tracking-tight">
            Subscribers
          </h1>
          <p className="text-sm text-muted">
            Search followers, monitor double opt-in statuses, and export subscriber lists.
          </p>
        </div>

        <a
          href="/admin/subscribers/export.csv"
          className="px-5 py-2.5 border border-ink bg-sage hover:bg-sage/80 text-ink font-medium text-sm transition-colors"
        >
          Export CSV &darr;
        </a>
      </div>

      {/* Counts Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-paper border border-line">
          <span className="text-xs uppercase tracking-wider text-muted block">Confirmed</span>
          <span className="font-serif text-3xl text-ink block mt-1">{confirmedCount || 0}</span>
        </div>
        <div className="p-4 bg-paper border border-line">
          <span className="text-xs uppercase tracking-wider text-muted block">Pending</span>
          <span className="font-serif text-3xl text-ink block mt-1">{pendingCount || 0}</span>
        </div>
        <div className="p-4 bg-paper border border-line">
          <span className="text-xs uppercase tracking-wider text-muted block">Unsubscribed</span>
          <span className="font-serif text-3xl text-ink block mt-1">{unsubscribedCount || 0}</span>
        </div>
        <div className="p-4 bg-paper border border-line">
          <span className="text-xs uppercase tracking-wider text-muted block">Bounced</span>
          <span className="font-serif text-3xl text-ink block mt-1">{bouncedCount || 0}</span>
        </div>
      </div>

      {/* Search Input */}
      <form method="GET" action="/admin/subscribers" className="flex gap-2 max-w-md">
        <label htmlFor="subscriber-search" className="sr-only">
          Search subscribers by email
        </label>
        <input
          id="subscriber-search"
          type="text"
          name="q"
          defaultValue={params.q || ''}
          placeholder="Search by email..."
          className="flex-1 px-3 py-2 bg-paper border border-ink text-sm rounded-none focus:outline-2 focus:outline-moss"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-paper-deep border border-ink text-sm font-medium hover:bg-paper cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Subscribers Table */}
      {subscribers && subscribers.length > 0 ? (
        <div className="border border-line bg-paper overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-deep border-b border-line text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="p-4">Email</th>
                <th className="p-4">Status</th>
                <th className="p-4">Consented</th>
                <th className="p-4">Confirmed</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {subscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-paper-deep/40 transition-colors">
                  <td className="p-4 font-mono text-xs">{sub.email}</td>
                  <td className="p-4">
                    <span
                      className={`text-xs uppercase tracking-wider px-2 py-0.5 border ${
                        sub.status === 'active' || sub.status === 'confirmed'
                          ? 'bg-sage-soft border-moss text-moss'
                          : sub.status === 'pending'
                          ? 'bg-paper-deep border-line text-muted'
                          : 'bg-paper-deep border-alert text-alert'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-muted">
                    {new Date(sub.consented_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-xs text-muted">
                    {sub.confirmed_at ? new Date(sub.confirmed_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-4 text-right">
                    <DeleteSubscriberButton id={sub.id} email={sub.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center border border-line bg-paper">
          <p className="font-serif italic text-lg text-muted">
            No subscribers found matching your search.
          </p>
        </div>
      )}
    </div>
  );
}
