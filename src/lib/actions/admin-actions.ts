'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { postInputSchema, bookInputSchema, siteSettingsSchema, PostInput, BookInput, SiteSettingsInput } from '@/lib/schemas';
import { generateSlug } from '@/lib/slug';
import { generateExcerpt } from '@/lib/excerpt';
import { recordAuditLog } from '@/lib/audit';
import { getEnv } from '@/lib/env';
import { getSectionPath, getPiecePath } from '@/lib/routing';


/**
 * Asserts that the currently signed-in user is an authorized admin.
 * Throws an error if unauthenticated or not an admin.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('UNAUTHENTICATED');
  }

  // Check site_admins table via is_admin() RPC
  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
  if (adminError || !isAdmin) {
    throw new Error('FORBIDDEN: You do not have admin permissions.');
  }

  return { supabase, user };
}

// ==========================================
// POSTS ACTIONS
// ==========================================

export async function createPostAction(input: PostInput) {
  const { supabase } = await requireAdmin();
  const validated = postInputSchema.parse(input);

  const slug = validated.slug || generateSlug(validated.title || validated.body_md.slice(0, 30));

  const { data, error } = await supabase
    .from('posts')
    .insert({
      kind: validated.kind,
      slug,
      title: validated.title || null,
      body_md: validated.body_md,
      excerpt: validated.excerpt || generateExcerpt(validated.body_md, validated.kind) || null,
      attribution: validated.attribution || null,
      allow_comments: validated.allow_comments ?? true,
      featured_image_path: validated.featured_image_path || null,
      featured_image_alt: validated.featured_image_alt || null,
      featured_image_caption: validated.featured_image_caption || null,
      status: 'draft',
    })
    .select('id, slug, kind')
    .single();

  if (error) {
    throw new Error(`Failed to create post: ${error.message}`);
  }

  revalidatePath('/admin/posts');
  await recordAuditLog({
    action: 'post.created',
    resource_type: 'post',
    resource_id: data.id,
    description: `Created draft ${validated.kind}: "${validated.title || 'Untitled'}"`,
    metadata: { kind: validated.kind, slug },
  });
  return data;
}

export async function updatePostAction(id: string, input: Partial<PostInput>) {
  const { supabase } = await requireAdmin();

  // Load existing post to check if already published (freeze slug if already published)
  const { data: existing, error: loadErr } = await supabase
    .from('posts')
    .select('id, status, slug, kind')
    .eq('id', id)
    .single();

  if (loadErr || !existing) {
    throw new Error('Post not found');
  }

  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.body_md !== undefined) updateData.body_md = input.body_md;
  if (input.excerpt !== undefined) {
    updateData.excerpt = input.excerpt || (input.body_md ? generateExcerpt(input.body_md, existing.kind) : null);
  } else if (input.body_md !== undefined) {
    // If post currently has no excerpt, autogenerate from updated body
    updateData.excerpt = generateExcerpt(input.body_md, existing.kind) || null;
  }
  if (input.attribution !== undefined) updateData.attribution = input.attribution;
  if (input.allow_comments !== undefined) updateData.allow_comments = input.allow_comments;
  if (input.featured_image_path !== undefined) updateData.featured_image_path = input.featured_image_path || null;
  if (input.featured_image_alt !== undefined) updateData.featured_image_alt = input.featured_image_alt || null;
  if (input.featured_image_caption !== undefined) updateData.featured_image_caption = input.featured_image_caption || null;

  // Slug can only be changed before first publish
  if (input.slug && existing.status === 'draft') {
    updateData.slug = input.slug;
  }

  const { error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update post: ${error.message}`);
  }

  if (existing.status === 'published') {
    revalidatePath('/');
    revalidatePath(getSectionPath(existing.kind));
    revalidatePath(getPiecePath(existing.kind, existing.slug));
  }

  revalidatePath('/admin/posts');
  return { success: true };
}

export async function publishPostAction(id: string, notify = true) {
  const { supabase } = await requireAdmin();

  const { data: post } = await supabase
    .from('posts')
    .select('kind, slug')
    .eq('id', id)
    .single();

  // Calls database function publish_post(p_id, p_notify) in a single transaction
  const { data: notificationId, error } = await supabase.rpc('publish_post', {
    p_id: id,
    p_notify: notify,
  });

  if (error) {
    throw new Error(`Publish failed: ${error.message}`);
  }

  // If a notification was created and notify is true, enqueue QStash job
  if (notificationId) {
    try {
      await enqueueNotificationJob(notificationId);
    } catch (jobErr) {
      console.error('Failed to enqueue QStash job for notification:', jobErr);
      // Post is still published safely; author can click "Send now" on Notifications screen
    }
  }

  // Revalidate public caches
  revalidatePath('/');
  if (post) {
    revalidatePath(getSectionPath(post.kind));
    revalidatePath(getPiecePath(post.kind, post.slug));
  }
  revalidatePath('/feed.xml');
  revalidatePath('/sitemap.xml');
  revalidatePath('/admin/posts');

  await recordAuditLog({
    action: 'post.published',
    resource_type: 'post',
    resource_id: id,
    description: `Published post (notify: ${notify})`,
    metadata: { notify, notificationId },
  });

  return { success: true, notificationId };
}

export async function unpublishPostAction(id: string) {
  const { supabase } = await requireAdmin();

  const { data: post, error } = await supabase
    .from('posts')
    .update({ status: 'draft' })
    .eq('id', id)
    .select('kind, slug')
    .single();

  if (error) {
    throw new Error(`Failed to unpublish: ${error.message}`);
  }

  revalidatePath('/');
  revalidatePath(getSectionPath(post.kind));
  revalidatePath(getPiecePath(post.kind, post.slug));
  revalidatePath('/feed.xml');
  revalidatePath('/sitemap.xml');
  revalidatePath('/admin/posts');

  await recordAuditLog({
    action: 'post.unpublished',
    resource_type: 'post',
    resource_id: id,
    description: `Unpublished post back to draft`,
  });

  return { success: true };
}

export async function deletePostAction(id: string) {
  const { supabase } = await requireAdmin();

  const { data: post, error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)
    .select('kind, slug, status')
    .single();

  if (error) {
    throw new Error(`Failed to delete: ${error.message}`);
  }

  if (post && post.status === 'published') {
    revalidatePath('/');
    revalidatePath(getSectionPath(post.kind));
    revalidatePath(getPiecePath(post.kind, post.slug));
    revalidatePath('/feed.xml');
    revalidatePath('/sitemap.xml');
  }


  revalidatePath('/admin/posts');

  await recordAuditLog({
    action: 'post.deleted',
    resource_type: 'post',
    resource_id: id,
    description: `Permanently deleted post`,
  });

  return { success: true };
}

// ==========================================
// BOOKS ACTIONS
// ==========================================

export async function createBookAction(input: BookInput) {
  const { supabase } = await requireAdmin();
  const validated = bookInputSchema.parse(input);

  const slug = validated.slug || generateSlug(validated.title);

  const { data, error } = await supabase
    .from('books')
    .insert({
      slug,
      title: validated.title,
      subtitle: validated.subtitle || null,
      synopsis_md: validated.synopsis_md,
      excerpt_md: validated.excerpt_md || null,
      cover_path: validated.cover_path || null,
      cover_alt: validated.cover_alt || null,
      progress: validated.progress,
      purchase_url: validated.purchase_url || null,
      release_date: validated.release_date || null,
      sort_order: validated.sort_order,
      status: 'draft',
    })
    .select('id, slug')
    .single();

  if (error) {
    throw new Error(`Failed to create book: ${error.message}`);
  }

  revalidatePath('/admin/books');
  return data;
}

export async function updateBookAction(id: string, input: Partial<BookInput>) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('books')
    .update(input)
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update book: ${error.message}`);
  }

  revalidatePath('/books');
  revalidatePath('/admin/books');
  return { success: true };
}

export async function publishBookAction(id: string, notify = true) {
  const { supabase } = await requireAdmin();

  const { data: notificationId, error } = await supabase.rpc('publish_book', {
    p_id: id,
    p_notify: notify,
  });

  if (error) {
    throw new Error(`Failed to publish book: ${error.message}`);
  }

  if (notificationId) {
    try {
      await enqueueNotificationJob(notificationId);
    } catch (jobErr) {
      console.error('Failed to enqueue book notification job:', jobErr);
    }
  }

  revalidatePath('/books');
  revalidatePath('/admin/books');
  return { success: true, notificationId };
}

export async function unpublishBookAction(id: string) {
  const { supabase } = await requireAdmin();

  const { data: book, error } = await supabase
    .from('books')
    .update({ status: 'draft' })
    .eq('id', id)
    .select('slug')
    .single();

  if (error) {
    throw new Error(`Failed to unpublish book: ${error.message}`);
  }

  revalidatePath('/');
  revalidatePath('/books');
  if (book?.slug) revalidatePath(`/books/${book.slug}`);
  revalidatePath('/admin/books');

  await recordAuditLog({
    action: 'book.unpublished',
    resource_type: 'book',
    resource_id: id,
    description: `Unpublished book back to draft`,
  });

  return { success: true };
}

export async function deleteBookAction(id: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete book: ${error.message}`);
  }

  revalidatePath('/books');
  revalidatePath('/admin/books');

  await recordAuditLog({
    action: 'book.deleted',
    resource_type: 'book',
    resource_id: id,
    description: `Permanently deleted book`,
  });

  return { success: true };
}

// ==========================================
// SETTINGS ACTIONS
// ==========================================

export async function updateSiteSettingsAction(input: SiteSettingsInput) {
  const { supabase } = await requireAdmin();
  const validated = siteSettingsSchema.parse(input);

  const { error } = await supabase
    .from('site_settings')
    .update({
      site_title: validated.site_title,
      tagline: validated.tagline || null,
      author_name: validated.author_name,
      about_md: validated.about_md,
      about_photo_path: validated.about_photo_path || null,
      about_photo_alt: validated.about_photo_alt || null,
      contact_email: validated.contact_email || null,
      social_links: validated.social_links,
    })
    .eq('id', 1);

  if (error) {
    throw new Error(`Failed to update settings: ${error.message}`);
  }

  revalidatePath('/');
  revalidatePath('/about');
  revalidatePath('/admin/about');

  await recordAuditLog({
    action: 'settings.updated',
    resource_type: 'settings',
    description: `Updated site settings and author profile`,
    metadata: { site_title: validated.site_title, author_name: validated.author_name },
  });

  return { success: true };
}

// ==========================================
// SUBSCRIBER MANAGEMENT ACTIONS
// ==========================================

export async function removeSubscriberAction(id: string) {
  const { supabase } = await requireAdmin();

  // Hard delete (erasure compliance FR-ADM-07, cascades to deliveries)
  const { error } = await supabase
    .from('subscribers')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to erase subscriber: ${error.message}`);
  }

  revalidatePath('/admin/subscribers');

  await recordAuditLog({
    action: 'subscriber.deleted',
    resource_type: 'subscriber',
    resource_id: id,
    description: `Permanently erased subscriber record`,
  });

  return { success: true };
}

// ==========================================
// QSTASH JOB DISPATCH HELPER
// ==========================================

async function enqueueNotificationJob(notificationId: string) {
  const env = getEnv();
  const targetUrl = `${env.NEXT_PUBLIC_SITE_URL}/api/jobs/notify`;

  const isLocalhost =
    env.NEXT_PUBLIC_SITE_URL.includes('localhost') ||
    env.NEXT_PUBLIC_SITE_URL.includes('127.0.0.1');

  const isQStashConfigured =
    Boolean(env.QSTASH_TOKEN) &&
    !env.QSTASH_TOKEN.includes('dummy') &&
    !env.QSTASH_TOKEN.startsWith('gQAAAAAA');

  if (isLocalhost || !isQStashConfigured) {
    console.log(`[Notification Engine] Processing job directly in-process for notification: ${notificationId}`);
    try {
      const { processNotificationDeliveries } = await import('@/lib/notification-worker');
      await processNotificationDeliveries(notificationId);
    } catch (err) {
      console.error('[Notification Engine] Direct processing failed:', err);
    }
    return;
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

    if (res.ok) return;

    const text = await res.text();
    console.warn(`[Notification Engine] QStash enqueue failed (${res.status}): ${text}. Falling back to in-process delivery.`);
  } catch (err) {
    console.warn('[Notification Engine] QStash dispatch error:', err);
  }

  try {
    const { processNotificationDeliveries } = await import('@/lib/notification-worker');
    await processNotificationDeliveries(notificationId);
  } catch (err) {
    console.error('[Notification Engine] Fallback direct processing failed:', err);
  }
}

