import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'usr-admin', email: 'admin@example.com' } },
        error: null,
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  }),
}));

import { processNotificationDeliveries } from '@/lib/notification-worker';

describe('Notification Dispatch & Resilience Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns not_found when notification record does not exist', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: new Error('not found') }),
        }),
      }),
    });

    const result = await processNotificationDeliveries('non-existent-id');
    expect(result.status).toBe('not_found');
  });

  it('populates subscriber delivery rows and updates status to done when empty or completed', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'notifications') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'notif-1',
                  status: 'processing',
                  post_id: 'post-1',
                  posts: { id: 'post-1', kind: 'poem', title: 'Dawn', slug: 'dawn', body_md: 'Morning light', excerpt: 'Morning' },
                },
                error: null,
              }),
            }),
          }),
          update: mockUpdate,
        };
      }
      if (table === 'subscribers') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { id: 'sub-1', email: 'reader1@example.com' },
                { id: 'sub-2', email: 'reader2@example.com' },
              ],
              error: null,
            }),
          }),
        };
      }
      if (table === 'notification_deliveries') {
        return {
          upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockResolvedValue({
                data: [], // all sent
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { author_name: 'Author', site_title: 'Title' }, error: null }),
          }),
        }),
      };
    });

    const result = await processNotificationDeliveries('notif-1');
    expect(result.status).toBe('done');
    expect(result.remaining).toBe(0);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'done' }));
  });
});
