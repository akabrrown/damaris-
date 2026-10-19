import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { SECURE_COOKIE_OPTIONS, createClient, createPublicClient } from '@/lib/supabase/server';

// Mock next/headers cookies()
const mockCookieStore = {
  getAll: vi.fn(),
  set: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockImplementation(async () => mockCookieStore),
}));

// Mock @supabase/ssr
const mockCreateServerClient = vi.fn();
vi.mock('@supabase/ssr', () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
  createBrowserClient: vi.fn(),
}));

// Mock @supabase/supabase-js
const mockCreateSupabaseClient = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mockCreateSupabaseClient(...args),
}));

describe('Cookie Security & Client Separation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SECURE_COOKIE_OPTIONS', () => {
    it('enforces httpOnly, sameSite=lax, and path=/', () => {
      expect(SECURE_COOKIE_OPTIONS.httpOnly).toBe(true);
      expect(SECURE_COOKIE_OPTIONS.sameSite).toBe('lax');
      expect(SECURE_COOKIE_OPTIONS.path).toBe('/');
    });
  });

  describe('createClient() - Authenticated Client with Cookies', () => {
    it('attaches SECURE_COOKIE_OPTIONS to createServerClient and merges options on cookieStore.set', async () => {
      mockCreateServerClient.mockImplementation((url, key, options) => {
        // Simulate calling setAll from auth refresh
        options.cookies.setAll([
          {
            name: 'sb-auth-token',
            value: 'jwt.token.value',
            options: { maxAge: 3600 },
          },
        ]);
        return { auth: { getUser: vi.fn() } };
      });

      await createClient();

      expect(mockCreateServerClient).toHaveBeenCalledTimes(1);
      const callArgs = mockCreateServerClient.mock.calls[0];
      const clientOptions = callArgs[2];

      expect(clientOptions.cookieOptions).toEqual(SECURE_COOKIE_OPTIONS);
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'sb-auth-token',
        'jwt.token.value',
        expect.objectContaining({
          maxAge: 3600,
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        })
      );
    });
  });

  describe('createPublicClient() - Cookieless Client for Readers & Pre-rendering', () => {
    it('creates a stateless client without calling next/headers cookies()', () => {
      const mockClient = { from: vi.fn() };
      mockCreateSupabaseClient.mockReturnValue(mockClient);

      const client = createPublicClient();
      expect(client).toBe(mockClient);

      expect(mockCreateSupabaseClient).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        })
      );
      expect(mockCookieStore.getAll).not.toHaveBeenCalled();
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });
  });

  describe('middleware - Cookie Isolation, Security Headers & Session Refresh', () => {
    it('leaves public routes cookieless and skips Supabase auth when no auth cookies exist', async () => {
      const { middleware } = await import('@/middleware');
      const req = new NextRequest(new URL('http://localhost:3000/poetry'));

      const response = await middleware(req);

      expect(mockCreateServerClient).not.toHaveBeenCalled();
      expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('x-request-id')).toBeTruthy();
      expect(response.cookies.getAll().length).toBe(0);
    });

    it('refreshes session with secure cookie options when sb- auth cookie is present', async () => {
      const { middleware } = await import('@/middleware');
      const req = new NextRequest(new URL('http://localhost:3000/poetry'), {
        headers: {
          cookie: 'sb-sample-auth-token=jwt.value.here',
        },
      });

      mockCreateServerClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-1' } }, error: null }),
        },
      });

      const response = await middleware(req);

      expect(mockCreateServerClient).toHaveBeenCalledTimes(1);
      const callArgs = mockCreateServerClient.mock.calls[0];
      const clientOptions = callArgs[2];

      expect(clientOptions.cookieOptions).toEqual(
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        })
      );
      expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
    });

    it('redirects unauthenticated users trying to access protected /admin routes to /admin/login', async () => {
      const { middleware } = await import('@/middleware');
      const req = new NextRequest(new URL('http://localhost:3000/admin/posts'));

      mockCreateServerClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      });

      const response = await middleware(req);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/admin/login?next=%2Fadmin%2Fposts');
      expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
    });

    it('allows access to /admin/login without redirecting unauthenticated users', async () => {
      const { middleware } = await import('@/middleware');
      const req = new NextRequest(new URL('http://localhost:3000/admin/login'));

      mockCreateServerClient.mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      });

      const response = await middleware(req);

      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });
  });
});

