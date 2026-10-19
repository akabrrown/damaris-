import { createAdminClient } from '@/lib/supabase/admin';
import { getEnv } from '@/lib/env';
import { buildNotificationEmail } from '@/lib/email-templates';
import { generateUnsubscribeToken } from '@/lib/tokens';
import { getPiecePath } from '@/lib/routing';
import { Resend } from 'resend';


export interface ProcessNotificationResult {
  status: 'done' | 'pending' | 'not_found';
  message: string;
  remaining: number;
  failedInBatch: number;
}

/**
 * Core notification delivery engine.
 * Idempotently creates delivery records for all confirmed subscribers,
 * generates personalized emails with single-click HMAC unsubscribe headers,
 * dispatches via Resend (or logs to console sink in development),
 * and transitions notification and delivery statuses.
 */
export async function processNotificationDeliveries(
  notificationId: string
): Promise<ProcessNotificationResult> {
  const env = getEnv();
  const supabase = createAdminClient();

  // 1. Load notification with associated post or book
  const { data: notification, error: notifErr } = await supabase
    .from('notifications')
    .select(`
      id,
      status,
      post_id,
      book_id,
      posts (id, kind, title, slug, body_md, excerpt),
      books (id, title, slug, synopsis_md)
    `)
    .eq('id', notificationId)
    .single();

  if (notifErr || !notification) {
    return {
      status: 'not_found',
      message: 'Notification record not found',
      remaining: 0,
      failedInBatch: 0,
    };
  }

  // 2. Mark processing
  await supabase
    .from('notifications')
    .update({ status: 'processing' })
    .eq('id', notificationId);

  // 3. Idempotently populate notification_deliveries for all confirmed subscribers
  const { data: confirmedSubscribers } = await supabase
    .from('subscribers')
    .select('id, email')
    .eq('status', 'confirmed');

  if (confirmedSubscribers && confirmedSubscribers.length > 0) {
    const deliveryInserts = confirmedSubscribers.map((sub) => ({
      notification_id: notificationId,
      subscriber_id: sub.id,
      status: 'queued' as const,
    }));

    await supabase
      .from('notification_deliveries')
      .upsert(deliveryInserts, { onConflict: 'notification_id,subscriber_id', ignoreDuplicates: true });
  }

  // 4. Load pending / failed deliveries
  const { data: pendingDeliveries } = await supabase
    .from('notification_deliveries')
    .select(`
      id,
      subscriber_id,
      status,
      attempts,
      subscribers (id, email)
    `)
    .eq('notification_id', notificationId)
    .neq('status', 'sent');

  if (!pendingDeliveries || pendingDeliveries.length === 0) {
    await supabase
      .from('notifications')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', notificationId);

    return {
      status: 'done',
      message: 'All subscriber deliveries completed',
      remaining: 0,
      failedInBatch: 0,
    };
  }

  // 5. Prepare piece metadata & email builder parameters
  const { data: settings } = await supabase
    .from('site_settings')
    .select('author_name, site_title')
    .eq('id', 1)
    .single();

  const authorName = settings?.author_name || 'Caroline Damaris Donkor';
  const siteTitle = settings?.site_title || 'Carolinedamaris';

  const isPost = !!notification.post_id && notification.posts;
  const isBook = !!notification.book_id && notification.books;

  const postObj = notification.posts as unknown as {
    id: string;
    kind: string;
    title: string | null;
    slug: string;
    body_md: string;
    excerpt: string | null;
  };
  const bookObj = notification.books as unknown as {
    id: string;
    title: string;
    slug: string;
    synopsis_md: string;
  };

  const pieceTitle = isPost ? (postObj.title || 'Untitled') : isBook ? bookObj.title : 'New Publication';
  const pieceKind = isPost ? postObj.kind : 'book';
  const pieceSlug = isPost ? postObj.slug : bookObj.slug;
  const pieceUrl = `${env.NEXT_PUBLIC_SITE_URL}${getPiecePath(pieceKind, pieceSlug)}`;


  const resend = env.RESEND_API_KEY && !env.RESEND_API_KEY.includes('dummy')
    ? new Resend(env.RESEND_API_KEY)
    : null;

  // Process in batches of up to 50
  const batch = pendingDeliveries.slice(0, 50);
  let failedInBatch = 0;

  for (const delivery of batch) {
    const subscriber = delivery.subscribers as unknown as { id: string; email: string };
    if (!subscriber || !subscriber.email) continue;

    const unsubToken = generateUnsubscribeToken(subscriber.id, env.UNSUBSCRIBE_HMAC_SECRET);
    const unsubscribeUrl = `${env.NEXT_PUBLIC_SITE_URL}/subscribe/unsubscribe?t=${unsubToken}`;

    const emailContent = buildNotificationEmail({
      pieceTitle,
      kind: pieceKind as 'poem' | 'story' | 'reflection' | 'quote' | 'book',
      previewText: isPost ? postObj.excerpt || undefined : bookObj.synopsis_md.slice(0, 300),
      fullText: isPost ? postObj.body_md : undefined,
      pieceUrl,
      unsubscribeUrl,
      authorName,
      siteTitle,
    });

    try {
      let msgId = `dev-msg-${Date.now()}`;
      if (resend) {
        const sendResult = await resend.emails.send({
          from: env.MAIL_FROM,
          to: subscriber.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });
        if (sendResult.error) {
          throw new Error(sendResult.error.message);
        }
        msgId = sendResult.data?.id || msgId;
      } else {
        console.log(`[Dev Mail Sink] Dispatched email to ${subscriber.email}: "${pieceTitle}"`);
      }

      await supabase
        .from('notification_deliveries')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider_message_id: msgId,
        })
        .eq('id', delivery.id);
    } catch (err: unknown) {
      failedInBatch++;
      const errorMsg = (err as Error).message || 'Failed to dispatch email';
      await supabase
        .from('notification_deliveries')
        .update({
          status: 'failed',
          attempts: delivery.attempts + 1,
          last_error: errorMsg.slice(0, 500),
        })
        .eq('id', delivery.id);
    }
  }

  // 6. Check remaining deliveries
  const { count: remainingCount } = await supabase
    .from('notification_deliveries')
    .select('*', { count: 'exact', head: true })
    .eq('notification_id', notificationId)
    .neq('status', 'sent');

  if (!remainingCount || remainingCount === 0) {
    await supabase
      .from('notifications')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', notificationId);

    return {
      status: 'done',
      message: 'All subscriber deliveries completed successfully',
      remaining: 0,
      failedInBatch,
    };
  }

  return {
    status: 'pending',
    message: `${remainingCount} deliveries remaining in queue`,
    remaining: remainingCount,
    failedInBatch,
  };
}
