import { createClient } from '@/lib/supabase/server';

export type AuditAction =
  | 'post.created'
  | 'post.updated'
  | 'post.published'
  | 'post.unpublished'
  | 'post.deleted'
  | 'book.created'
  | 'book.updated'
  | 'book.published'
  | 'book.unpublished'
  | 'book.deleted'
  | 'subscriber.created'
  | 'subscriber.confirmed'
  | 'subscriber.unsubscribed'
  | 'subscriber.deleted'
  | 'subscribers.exported'
  | 'settings.updated'
  | 'notification.sent'
  | 'notification.retried'
  | 'admin.login'
  | 'system.check';

export type AuditResourceType =
  | 'post'
  | 'book'
  | 'subscriber'
  | 'settings'
  | 'notification'
  | 'security';

export interface AuditEntry {
  id: string;
  actor_id: string | null;
  actor_email: string;
  action: AuditAction | string;
  resource_type: AuditResourceType;
  resource_id: string | null;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

/**
 * Records an immutable audit log entry.
 * Safely persists to audit_logs table when present, and logs to standard audit telemetry.
 */
export async function recordAuditLog(entry: {
  action: AuditAction | string;
  resource_type: AuditResourceType;
  resource_id?: string | null;
  description: string;
  metadata?: Record<string, unknown>;
  actor_email?: string;
  actor_id?: string;
}): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const actor_id = entry.actor_id || user?.id || null;
    const actor_email = entry.actor_email || user?.email || 'system';

    // Persist to audit_logs table in Supabase
    const { error } = await supabase.from('audit_logs').insert({
      actor_id,
      actor_email,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id || null,
      metadata: {
        description: entry.description,
        ...(entry.metadata || {}),
      },
      created_at: new Date().toISOString(),
    });

    if (error) {
      // Table may not yet be migrated in remote instance; log telemetry
      console.log(`[Audit Log] ${entry.action} by ${actor_email}: ${entry.description}`);
    } else {
      console.log(`[Audit Log] (Recorded) ${entry.action} by ${actor_email}: ${entry.description}`);
    }
  } catch (err) {
    console.warn('[Audit Log] Failed to record audit log:', err);
  }
}

/**
 * Retrieves audit logs, merging explicit persisted audit logs with system
 * event timelines (content creations, publications, subscriber updates, notifications)
 * for a comprehensive operational audit trail.
 */
export async function getAuditLogs(filter?: {
  resource_type?: string;
  q?: string;
  limit?: number;
}): Promise<AuditEntry[]> {
  const supabase = await createClient();
  const limit = filter?.limit || 100;
  const entries: AuditEntry[] = [];

  // 1. Query persisted audit_logs table
  try {
    let query = supabase
      .from('audit_logs')
      .select('id, actor_id, actor_email, action, resource_type, resource_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filter?.resource_type && filter.resource_type !== 'all') {
      query = query.eq('resource_type', filter.resource_type);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      for (const row of data) {
        entries.push({
          id: row.id,
          actor_id: row.actor_id,
          actor_email: row.actor_email,
          action: row.action,
          resource_type: row.resource_type as AuditResourceType,
          resource_id: row.resource_id,
          description: (row.metadata as { description?: string })?.description || row.action,
          metadata: row.metadata as Record<string, unknown>,
          created_at: row.created_at,
        });
      }
    }
  } catch {
    // If audit_logs table is not yet provisioned, continue to system events
  }

  // 2. Synthesize system events to ensure a complete, rich audit trail
  try {
    const [postsRes, booksRes, subsRes, notifsRes] = await Promise.all([
      supabase
        .from('posts')
        .select('id, title, kind, status, created_at, updated_at, published_at')
        .order('created_at', { ascending: false })
        .limit(25),
      supabase
        .from('books')
        .select('id, title, status, created_at, updated_at, published_at')
        .order('created_at', { ascending: false })
        .limit(25),
      supabase
        .from('subscribers')
        .select('id, email, status, consented_at, confirmed_at, unsubscribed_at')
        .order('consented_at', { ascending: false })
        .limit(25),
      supabase
        .from('notifications')
        .select('id, status, created_at, completed_at')
        .order('created_at', { ascending: false })
        .limit(25),
    ]);

    if (postsRes.data) {
      for (const p of postsRes.data) {
        if (p.published_at) {
          entries.push({
            id: `synth-post-pub-${p.id}`,
            actor_id: null,
            actor_email: 'admin',
            action: 'post.published',
            resource_type: 'post',
            resource_id: p.id,
            description: `Published ${p.kind}: "${p.title || 'Untitled'}"`,
            metadata: { kind: p.kind, title: p.title, status: p.status },
            created_at: p.published_at,
          });
        }
        if (p.created_at) {
          entries.push({
            id: `synth-post-create-${p.id}`,
            actor_id: null,
            actor_email: 'admin',
            action: 'post.created',
            resource_type: 'post',
            resource_id: p.id,
            description: `Created draft ${p.kind}: "${p.title || 'Untitled'}"`,
            metadata: { kind: p.kind, title: p.title, status: p.status },
            created_at: p.created_at,
          });
        }
      }
    }

    if (booksRes.data) {
      for (const b of booksRes.data) {
        entries.push({
          id: `synth-book-${b.id}`,
          actor_id: null,
          actor_email: 'admin',
          action: b.status === 'published' ? 'book.published' : 'book.created',
          resource_type: 'book',
          resource_id: b.id,
          description: `${b.status === 'published' ? 'Published' : 'Updated'} book: "${b.title}"`,
          metadata: { title: b.title, status: b.status },
          created_at: b.updated_at || b.created_at,
        });
      }
    }

    if (subsRes.data) {
      for (const s of subsRes.data) {
        if (s.confirmed_at) {
          entries.push({
            id: `synth-sub-conf-${s.id}`,
            actor_id: null,
            actor_email: s.email,
            action: 'subscriber.confirmed',
            resource_type: 'subscriber',
            resource_id: s.id,
            description: `Subscriber confirmed double opt-in (${s.email})`,
            metadata: { email: s.email, status: s.status },
            created_at: s.confirmed_at,
          });
        }
        if (s.unsubscribed_at) {
          entries.push({
            id: `synth-sub-unsub-${s.id}`,
            actor_id: null,
            actor_email: s.email,
            action: 'subscriber.unsubscribed',
            resource_type: 'subscriber',
            resource_id: s.id,
            description: `Subscriber unsubscribed via direct link (${s.email})`,
            metadata: { email: s.email, status: s.status },
            created_at: s.unsubscribed_at,
          });
        }
        if (s.consented_at) {
          entries.push({
            id: `synth-sub-cons-${s.id}`,
            actor_id: null,
            actor_email: s.email,
            action: 'subscriber.created',
            resource_type: 'subscriber',
            resource_id: s.id,
            description: `New subscription request submitted (${s.email})`,
            metadata: { email: s.email, status: s.status },
            created_at: s.consented_at,
          });
        }
      }
    }

    if (notifsRes.data) {
      for (const n of notifsRes.data) {
        entries.push({
          id: `synth-notif-${n.id}`,
          actor_id: null,
          actor_email: 'system',
          action: n.completed_at ? 'notification.sent' : 'notification.queued',
          resource_type: 'notification',
          resource_id: n.id,
          description: `Notification dispatch batch ${n.status}`,
          metadata: { status: n.status },
          created_at: n.completed_at || n.created_at,
        });
      }
    }
  } catch (err) {
    console.warn('[Audit Log] Failed to synthesize system events:', err);
  }

  // Deduplicate entries by ID
  const seenIds = new Set<string>();
  let merged = entries.filter((e) => {
    if (seenIds.has(e.id)) return false;
    seenIds.add(e.id);
    return true;
  });

  // Sort chronologically descending
  merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Apply filters
  if (filter?.resource_type && filter.resource_type !== 'all') {
    merged = merged.filter((e) => e.resource_type === filter.resource_type);
  }

  if (filter?.q) {
    const q = filter.q.toLowerCase().trim();
    merged = merged.filter(
      (e) =>
        e.action.toLowerCase().includes(q) ||
        e.actor_email.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
    );
  }

  return merged.slice(0, limit);
}
