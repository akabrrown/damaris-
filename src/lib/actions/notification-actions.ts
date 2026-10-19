'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEnv } from '@/lib/env';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) throw new Error('UNAUTHENTICATED');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) throw new Error('FORBIDDEN');

  return { supabase, user };
}

export async function retryFailedDeliveriesAction(notificationId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  // Reset failed delivery rows to 'queued'
  await supabase
    .from('notification_deliveries')
    .update({ status: 'queued' })
    .eq('notification_id', notificationId)
    .eq('status', 'failed');

  await supabase
    .from('notifications')
    .update({ status: 'processing' })
    .eq('id', notificationId);

  // Re-enqueue job
  await triggerNotifyJob(notificationId);

  revalidatePath('/admin/notifications');
  return { success: true };
}

export async function sendNotificationNowAction(notificationId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  await supabase
    .from('notifications')
    .update({ status: 'processing' })
    .eq('id', notificationId);

  await triggerNotifyJob(notificationId);

  revalidatePath('/admin/notifications');
  return { success: true };
}

async function triggerNotifyJob(notificationId: string) {
  const env = getEnv();
  const targetUrl = `${env.NEXT_PUBLIC_SITE_URL}/api/jobs/notify`;

  if (!env.QSTASH_TOKEN || env.QSTASH_TOKEN.includes('dummy')) {
    // Local / direct dispatch
    try {
      await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
    } catch (err) {
      console.error('Local job dispatch failed:', err);
    }
    return;
  }

  const res = await fetch(`https://qstash.upstash.io/v2/publish/${encodeURIComponent(targetUrl)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.QSTASH_TOKEN}`,
      'Content-Type': 'application/json',
      'Upstash-Retries': '3',
    },
    body: JSON.stringify({ notificationId }),
  });

  if (!res.ok) {
    throw new Error(`QStash dispatch failed: ${await res.text()}`);
  }
}
