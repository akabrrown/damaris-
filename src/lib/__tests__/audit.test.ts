import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  })),
}));

import { recordAuditLog, getAuditLogs } from '@/lib/audit';

describe('Audit Logging & Ledger Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'usr-123', email: 'admin@example.com' } },
      error: null,
    });
  });

  describe('recordAuditLog', () => {
    it('persists audit entry with actor and timestamp without throwing', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockReturnValue({ insert: mockInsert });

      await expect(
        recordAuditLog({
          action: 'post.published',
          resource_type: 'post',
          resource_id: 'post-1',
          description: 'Published poem: "The Quiet River"',
        })
      ).resolves.not.toThrow();

      expect(mockFrom).toHaveBeenCalledWith('audit_logs');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'post.published',
          actor_email: 'admin@example.com',
          resource_type: 'post',
          resource_id: 'post-1',
        })
      );
    });

    it('gracefully handles database errors without crashing', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: new Error('Table does not exist') });
      mockFrom.mockReturnValue({ insert: mockInsert });

      await expect(
        recordAuditLog({
          action: 'subscribers.exported',
          resource_type: 'subscriber',
          description: 'Exported 10 subscribers',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('getAuditLogs', () => {
    it('synthesizes system events and sorts chronologically descending', async () => {
      // Mock audit_logs returning empty
      mockFrom.mockImplementation((table: string) => {
        if (table === 'audit_logs') {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            eq: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'posts') {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'p-1',
                  title: 'Dawn Reflections',
                  kind: 'poem',
                  status: 'published',
                  created_at: '2026-10-18T10:00:00Z',
                  updated_at: '2026-10-18T10:00:00Z',
                  published_at: '2026-10-18T10:30:00Z',
                },
              ],
              error: null,
            }),
          };
        }
        if (table === 'subscribers') {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 's-1',
                  email: 'reader@example.com',
                  status: 'confirmed',
                  consented_at: '2026-10-17T08:00:00Z',
                  confirmed_at: '2026-10-17T08:05:00Z',
                  unsubscribed_at: null,
                },
              ],
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const logs = await getAuditLogs();
      expect(logs.length).toBeGreaterThan(0);

      // Verify chronological sort: newest first
      for (let i = 0; i < logs.length - 1; i++) {
        const current = new Date(logs[i].created_at).getTime();
        const next = new Date(logs[i + 1].created_at).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('filters correctly by search query', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'posts') {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'p-10',
                  title: 'Golden Sunset',
                  kind: 'story',
                  status: 'published',
                  created_at: '2026-10-19T09:00:00Z',
                  published_at: '2026-10-19T09:30:00Z',
                },
              ],
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const matching = await getAuditLogs({ q: 'Golden' });
      expect(matching.some((l) => l.description.includes('Golden'))).toBe(true);

      const nonMatching = await getAuditLogs({ q: 'NonExistentXYZ' });
      expect(nonMatching.length).toBe(0);
    });
  });
});
