'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEnv } from '@/lib/env';
import { processNotificationDeliveries } from '@/lib/notification-worker';

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

  // Re-enqueue or process job
  const result = await triggerNotifyJob(notificationId);

  try {
    const { recordAuditLog } = await import('@/lib/audit');
    await recordAuditLog({
      action: 'notification.retried',
      resource_type: 'notification',
      resource_id: notificationId,
      description: `Retried failed notification deliveries (${result.method})`,
    });
  } catch {
    // Non-blocking
  }

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

  const result = await triggerNotifyJob(notificationId);

  try {
    const { recordAuditLog } = await import('@/lib/audit');
    await recordAuditLog({
      action: 'notification.dispatched',
      resource_type: 'notification',
      resource_id: notificationId,
      description: `Dispatched notification delivery (${result.method})`,
    });
  } catch {
    // Non-blocking
  }

  revalidatePath('/admin/notifications');
  return { success: true };
}

async function triggerNotifyJob(notificationId: string): Promise<{ method: string }> {
  const env = getEnv();
  const targetUrl = `${env.NEXT_PUBLIC_SITE_URL}/api/jobs/notify`;

  // Local development detection: QStash cloud servers cannot deliver HTTP webhooks to localhost
  const isLocalhost =
    env.NEXT_PUBLIC_SITE_URL.includes('localhost') ||
    env.NEXT_PUBLIC_SITE_URL.includes('127.0.0.1');

  // Verify QStash token is configured and not a placeholder or misconfigured Redis REST token (starts with gQAAAAAA...)
  const isQStashConfigured =
    Boolean(env.QSTASH_TOKEN) &&
    !env.QSTASH_TOKEN.includes('dummy') &&
    !env.QSTASH_TOKEN.startsWith('gQAAAAAA');

  if (isLocalhost || !isQStashConfigured) {
    console.log(`[Notification Engine] Processing job directly in-process for notification: ${notificationId}`);
    try {
      await processNotificationDeliveries(notificationId);
    } catch (err) {
      console.error('[Notification Engine] Direct processing failed:', err);
    }
    return { method: isLocalhost ? 'local_direct' : 'fallback_direct' };
  }

  try {
    const res = await fetch(`https://qstash.upstash.io/v2/publish/${encodeURIComponent(targetUrl)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.QSTASH_TOKEN}`,
        'Content-Type': 'application/json',
        'Upstash-Retries': '3',
      },
      body: JSON.stringify({ notificationId }),
    });

    if (res.ok) {
      return { method: 'qstash' };
    }

    const errText = await res.text();
    console.warn(`[Notification Engine] QStash dispatch error (${res.status}): ${errText}. Falling back to in-process delivery.`);
  } catch (err) {
    console.warn('[Notification Engine] QStash network dispatch error:', err);
  }

  // Graceful fallback: process directly so subscriber emails are not blocked
  try {
    await processNotificationDeliveries(notificationId);
  } catch (err) {
    console.error('[Notification Engine] Fallback direct processing failed:', err);
  }
  return { method: 'fallback_direct' };
}

