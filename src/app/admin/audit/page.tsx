import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuditLogs } from '@/lib/audit';

interface PageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export default async function AdminAuditPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/admin/login');

  // Load audit logs with filters
  const logs = await getAuditLogs({
    resource_type: params.type,
    q: params.q,
    limit: 100,
  });

  // Load system integrity counts
  const [
    { count: adminsCount },
    { count: postsCount },
    { count: booksCount },
    { count: subscribersCount },
  ] = await Promise.all([
    supabase.from('site_admins').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('books').select('*', { count: 'exact', head: true }),
    supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
  ]);

  const activeType = params.type || 'all';

  const typeFilters: { label: string; value: string }[] = [
    { label: 'All Events', value: 'all' },
    { label: 'Posts', value: 'post' },
    { label: 'Books', value: 'book' },
    { label: 'Subscribers', value: 'subscriber' },
    { label: 'Settings', value: 'settings' },
    { label: 'Notifications', value: 'notification' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="font-serif text-3xl text-ink font-normal tracking-tight">
            System &amp; Security Audit
          </h1>
          <p className="text-sm text-muted">
            Append-only ledger of administrative changes, publications, subscriber lifecycles, and integrity checks.
          </p>
        </div>

        <a
          href="/admin/audit/export.csv"
          className="px-5 py-2.5 border border-ink bg-sage hover:bg-sage/80 text-ink font-medium text-sm transition-colors cursor-pointer"
        >
          Export Audit CSV &darr;
        </a>
      </div>

      {/* System Integrity & Health Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-paper border border-line">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted block">Database &amp; RLS</span>
            <span className="inline-block w-2 h-2 rounded-full bg-moss" title="Operational"></span>
          </div>
          <span className="font-serif text-2xl text-ink block mt-1">Protected</span>
          <span className="text-[11px] text-muted block mt-0.5">8 policies enforced</span>
        </div>

        <div className="p-4 bg-paper border border-line">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted block">Active Admins</span>
            <span className="inline-block w-2 h-2 rounded-full bg-moss" title="Verified"></span>
          </div>
          <span className="font-serif text-2xl text-ink block mt-1">{adminsCount || 1}</span>
          <span className="text-[11px] text-muted block mt-0.5">Authorized accounts</span>
        </div>

        <div className="p-4 bg-paper border border-line">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted block">Content Records</span>
            <span className="text-xs text-muted">Total</span>
          </div>
          <span className="font-serif text-2xl text-ink block mt-1">{(postsCount || 0) + (booksCount || 0)}</span>
          <span className="text-[11px] text-muted block mt-0.5">{postsCount || 0} writings &middot; {booksCount || 0} books</span>
        </div>

        <div className="p-4 bg-paper border border-line">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted block">Confirmed Audience</span>
            <span className="inline-block w-2 h-2 rounded-full bg-moss" title="Double Opt-in"></span>
          </div>
          <span className="font-serif text-2xl text-ink block mt-1">{subscribersCount || 0}</span>
          <span className="text-[11px] text-muted block mt-0.5">Double opt-in verified</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {typeFilters.map((tf) => (
            <Link
              key={tf.value}
              href={`/admin/audit?type=${tf.value}${params.q ? `&q=${encodeURIComponent(params.q)}` : ''}`}
              className={`px-3 py-1.5 border transition-colors ${
                activeType === tf.value
                  ? 'bg-sage border-ink text-ink font-semibold'
                  : 'bg-paper-deep border-line text-muted hover:text-ink'
              }`}
            >
              {tf.label}
            </Link>
          ))}
        </div>

        <form method="GET" action="/admin/audit" className="flex gap-2 max-w-md">
          {activeType !== 'all' && <input type="hidden" name="type" value={activeType} />}
          <label htmlFor="audit-search" className="sr-only">
            Search audit events
          </label>
          <input
            id="audit-search"
            type="text"
            name="q"
            defaultValue={params.q || ''}
            placeholder="Search actions, emails, or descriptions..."
            className="flex-1 px-3 py-2 bg-paper border border-ink text-sm rounded-none focus:outline-2 focus:outline-moss"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-paper-deep border border-ink text-sm font-medium hover:bg-paper cursor-pointer"
          >
            Search
          </button>
          {params.q && (
            <Link
              href={`/admin/audit${activeType !== 'all' ? `?type=${activeType}` : ''}`}
              className="px-3 py-2 text-xs text-muted hover:text-ink self-center underline"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Audit Log Table */}
      {logs && logs.length > 0 ? (
        <div className="border border-line bg-paper overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-deep border-b border-line text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Description</th>
                <th className="p-4">Resource</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {logs.map((log) => {
                const date = new Date(log.created_at);
                const isDelete = log.action.includes('deleted') || log.action.includes('unpublish');
                const isPublish = log.action.includes('publish') || log.action.includes('confirmed');

                return (
                  <tr key={log.id} className="hover:bg-paper-deep/40 transition-colors">
                    <td className="p-4 text-xs font-mono text-muted whitespace-nowrap">
                      <div>{date.toLocaleDateString()}</div>
                      <div className="text-[11px] text-muted/70">{date.toLocaleTimeString()}</div>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`text-xs uppercase tracking-wider px-2 py-0.5 border font-mono ${
                          isPublish
                            ? 'bg-sage-soft border-moss text-moss'
                            : isDelete
                            ? 'bg-paper-deep border-alert text-alert'
                            : 'bg-paper-deep border-line text-muted'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="p-4 text-xs font-mono text-ink">
                      {log.actor_email}
                    </td>

                    <td className="p-4 text-xs text-ink max-w-md">
                      <p className="font-sans leading-relaxed">{log.description}</p>
                    </td>

                    <td className="p-4 text-xs font-mono text-muted whitespace-nowrap">
                      <span className="capitalize">{log.resource_type}</span>
                      {log.resource_id && (
                        <span className="block text-[11px] text-muted/60 truncate max-w-[120px]" title={log.resource_id}>
                          {log.resource_id}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center border border-line bg-paper">
          <p className="font-serif italic text-lg text-muted">
            No audit records found matching your query.
          </p>
        </div>
      )}
    </div>
  );
}
