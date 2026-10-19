import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  // Check admin authorization
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-serif text-2xl text-alert mb-2">Access Denied</h1>
        <p className="text-sm text-muted">
          Your account ({user.email}) is not registered in the site_admins list.
        </p>
      </div>
    );
  }

  // Load subscriber metrics
  const [
    { count: confirmedCount },
    { count: pendingCount },
    { count: unsubscribedCount },
    { count: bouncedCount },
    { data: drafts },
    { data: latestNotification },
  ] = await Promise.all([
    supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('status', 'unsubscribed'),
    supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('status', 'bounced'),
    supabase.from('posts').select('id, kind, title, slug, updated_at').eq('status', 'draft').order('updated_at', { ascending: false }).limit(5),
    supabase.from('notifications').select('id, status, created_at, completed_at, post_id, book_id').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  return (
    <div className="space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal tracking-tight">
            Author Dashboard
          </h1>
          <p className="text-sm text-muted mt-1">
            Welcome back. Overview of subscribers, drafts, and recent activity.
          </p>
        </div>

        {/* Quick New Writing Actions */}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/posts/new?kind=poem"
            className="px-3 py-2 bg-sage hover:bg-sage/80 border border-ink text-ink text-xs uppercase tracking-wider font-medium"
          >
            + New Poem
          </Link>
          <Link
            href="/admin/posts/new?kind=story"
            className="px-3 py-2 bg-sage hover:bg-sage/80 border border-ink text-ink text-xs uppercase tracking-wider font-medium"
          >
            + New Story
          </Link>
          <Link
            href="/admin/posts/new?kind=reflection"
            className="px-3 py-2 bg-sage hover:bg-sage/80 border border-ink text-ink text-xs uppercase tracking-wider font-medium"
          >
            + New Reflection
          </Link>
          <Link
            href="/admin/posts/new?kind=quote"
            className="px-3 py-2 bg-sage hover:bg-sage/80 border border-ink text-ink text-xs uppercase tracking-wider font-medium"
          >
            + New Quote
          </Link>
          <Link
            href="/admin/books/new"
            className="px-3 py-2 border border-line bg-paper-deep text-ink text-xs uppercase tracking-wider font-medium hover:bg-paper"
          >
            + New Book
          </Link>
        </div>
      </div>

      {/* Subscriber Statistics Cards */}
      <section aria-labelledby="sub-metrics-heading">
        <h2 id="sub-metrics-heading" className="text-xs uppercase tracking-wider text-muted font-semibold mb-4">
          Subscribers Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 border border-line bg-paper">
            <span className="text-xs text-muted uppercase tracking-wider block">Confirmed</span>
            <span className="font-serif text-3xl sm:text-4xl text-ink font-normal mt-2 block">
              {confirmedCount || 0}
            </span>
            <span className="text-xs text-moss mt-1 block">Active recipients</span>
          </div>

          <div className="p-5 border border-line bg-paper">
            <span className="text-xs text-muted uppercase tracking-wider block">Pending</span>
            <span className="font-serif text-3xl sm:text-4xl text-ink font-normal mt-2 block">
              {pendingCount || 0}
            </span>
            <span className="text-xs text-muted mt-1 block">Awaiting confirmation</span>
          </div>

          <div className="p-5 border border-line bg-paper">
            <span className="text-xs text-muted uppercase tracking-wider block">Unsubscribed</span>
            <span className="font-serif text-3xl sm:text-4xl text-ink font-normal mt-2 block">
              {unsubscribedCount || 0}
            </span>
            <span className="text-xs text-muted mt-1 block">Expressed opt-out</span>
          </div>

          <div className="p-5 border border-line bg-paper">
            <span className="text-xs text-muted uppercase tracking-wider block">Bounced / Failed</span>
            <span className="font-serif text-3xl sm:text-4xl text-ink font-normal mt-2 block">
              {bouncedCount || 0}
            </span>
            <span className="text-xs text-muted mt-1 block">Suppressed from mailings</span>
          </div>
        </div>
      </section>

      {/* Drafts & Notifications split view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Working Drafts */}
        <section aria-labelledby="drafts-heading" className="lg:col-span-7">
          <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
            <h2 id="drafts-heading" className="text-xs uppercase tracking-wider text-muted font-semibold">
              Current Drafts
            </h2>
            <Link href="/admin/posts?status=draft" className="text-xs text-moss hover:text-ink underline">
              View all &rarr;
            </Link>
          </div>

          {drafts && drafts.length > 0 ? (
            <div className="divide-y divide-line/60 border border-line bg-paper">
              {drafts.map((d) => (
                <div key={d.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted mr-2">{d.kind}</span>
                    <span className="font-serif text-lg text-ink font-normal">{d.title || 'Untitled'}</span>
                  </div>
                  <Link
                    href={`/admin/posts/${d.id}`}
                    className="px-3 py-1 bg-sage/60 hover:bg-sage border border-ink text-xs font-medium"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 border border-line text-center text-sm text-muted italic">
              No active drafts. You are all caught up.
            </div>
          )}
        </section>

        {/* Latest Notification Status */}
        <section aria-labelledby="notif-heading" className="lg:col-span-5">
          <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
            <h2 id="notif-heading" className="text-xs uppercase tracking-wider text-muted font-semibold">
              Last Publish Notification
            </h2>
            <Link href="/admin/notifications" className="text-xs text-moss hover:text-ink underline">
              Details &rarr;
            </Link>
          </div>

          <div className="p-5 border border-line bg-paper space-y-3">
            {latestNotification ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Status:</span>
                  <span className="font-medium uppercase tracking-wider text-xs px-2 py-0.5 bg-sage-soft border border-line">
                    {latestNotification.status}
                  </span>
                </div>
                <div className="text-xs text-muted">
                  Queued: {new Date(latestNotification.created_at).toLocaleString()}
                </div>
                {latestNotification.completed_at && (
                  <div className="text-xs text-muted">
                    Completed: {new Date(latestNotification.completed_at).toLocaleString()}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted italic">No notifications dispatched yet.</p>
            )}
          </div>
        </section>

        {/* System & Security Audit Section */}
        <section aria-labelledby="audit-heading" className="lg:col-span-12">
          <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
            <h2 id="audit-heading" className="text-xs uppercase tracking-wider text-muted font-semibold">
              Security &amp; System Audit
            </h2>
            <Link href="/admin/audit" className="text-xs text-moss hover:text-ink underline">
              View complete audit log &rarr;
            </Link>
          </div>

          <div className="p-5 border border-line bg-paper flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-ink font-medium">Activity Logging &amp; Access Ledger</p>
              <p className="text-xs text-muted">
                Review verified subscriber events, content publish/unpublish records, and administrative security trails.
              </p>
            </div>
            <Link
              href="/admin/audit"
              className="px-4 py-2 border border-ink bg-sage hover:bg-sage/80 text-ink text-xs font-medium whitespace-nowrap"
            >
              Open Audit Trail &rarr;
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
