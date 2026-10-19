import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { retryFailedDeliveriesAction, sendNotificationNowAction } from '@/lib/actions/notification-actions';

export default async function AdminNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/admin/login');

  // Load notifications with delivery counts
  const { data: notifications } = await supabase
    .from('notifications')
    .select(`
      id,
      status,
      created_at,
      completed_at,
      post_id,
      book_id,
      posts (title, kind),
      books (title),
      notification_deliveries (id, status, attempts, last_error)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-4">
        <h1 className="font-serif text-3xl text-ink font-normal tracking-tight">
          Notifications &amp; Deliveries
        </h1>
        <p className="text-sm text-muted">
          Review subscriber email delivery logs, retry failed messages, and monitor outbox status.
        </p>
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-6">
          {notifications.map((notif) => {
            const deliveries = notif.notification_deliveries || [];
            const sentCount = deliveries.filter((d) => d.status === 'sent').length;
            const failedCount = deliveries.filter((d) => d.status === 'failed').length;
            const queuedCount = deliveries.filter((d) => d.status === 'queued').length;

            const postObj = notif.posts as unknown as { title: string | null; kind: string } | null;
            const bookObj = notif.books as unknown as { title: string } | null;
            const title = postObj?.title || bookObj?.title || 'Untitled Piece';
            const kind = postObj?.kind || (bookObj ? 'book' : 'item');

            return (
              <div key={notif.id} className="border border-line bg-paper p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted mr-2">{kind}</span>
                    <span className="font-serif text-xl sm:text-2xl text-ink font-normal">{title}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 bg-sage-soft border border-line">
                      {notif.status}
                    </span>
                    <span className="text-xs text-muted">
                      Queued: {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Delivery Stats Bar */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-paper-deep border border-line">
                    <span className="text-xs uppercase tracking-wider text-muted block">Total</span>
                    <span className="font-serif text-2xl text-ink font-normal block mt-1">
                      {deliveries.length}
                    </span>
                  </div>
                  <div className="p-3 bg-paper-deep border border-line">
                    <span className="text-xs uppercase tracking-wider text-muted block">Sent</span>
                    <span className="font-serif text-2xl text-moss font-normal block mt-1">
                      {sentCount}
                    </span>
                  </div>
                  <div className="p-3 bg-paper-deep border border-line">
                    <span className="text-xs uppercase tracking-wider text-muted block">Failed</span>
                    <span className={`font-serif text-2xl font-normal block mt-1 ${failedCount > 0 ? 'text-alert' : 'text-muted'}`}>
                      {failedCount}
                    </span>
                  </div>
                  <div className="p-3 bg-paper-deep border border-line">
                    <span className="text-xs uppercase tracking-wider text-muted block">Queued</span>
                    <span className="font-serif text-2xl text-muted font-normal block mt-1">
                      {queuedCount}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-muted">
                    {notif.completed_at
                      ? `Finished: ${new Date(notif.completed_at).toLocaleString()}`
                      : 'Job is pending or processing in background.'}
                  </div>

                  <div className="flex items-center space-x-3">
                    {failedCount > 0 && (
                      <form
                        action={async () => {
                          'use server';
                          await retryFailedDeliveriesAction(notif.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="px-4 py-2 bg-sage hover:bg-sage/80 border border-ink text-ink text-xs font-medium cursor-pointer"
                        >
                          Retry {failedCount} Failed Deliveries
                        </button>
                      </form>
                    )}

                    {notif.status === 'pending' && (
                      <form
                        action={async () => {
                          'use server';
                          await sendNotificationNowAction(notif.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="px-4 py-2 bg-sage hover:bg-sage/80 border border-ink text-ink text-xs font-medium cursor-pointer"
                        >
                          Send Now
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center border border-line bg-paper">
          <p className="font-serif italic text-lg text-muted">
            No notification batches have been created yet. When you publish a piece with &ldquo;Email subscribers&rdquo; on, it will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
