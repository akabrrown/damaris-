import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function applySecurityHeaders(response: NextResponse, requestId: string, cspHeader: string) {
  response.headers.set('x-request-id', requestId);
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

export async function middleware(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  // Content Security Policy (TDD Section 8.1 with Vercel Live compatibility)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vercel.live;
    img-src 'self' blob: data: https://*.supabase.co https://vercel.live https://vercel.com;
    font-src 'self' https://fonts.gstatic.com https://vercel.live;
    connect-src 'self' https://*.supabase.co https://qstash.upstash.io https://*.upstash.io https://vercel.live https://*.pusher.com wss://*.pusher.com;
    frame-src 'self' https://vercel.live;
    frame-ancestors 'self' https://vercel.live;
    form-action 'self';
    base-uri 'self';
    object-src 'none';
  `.replace(/\s{2,}/g, ' ').trim();

  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });


  const pathname = req.nextUrl.pathname;
  const isProduction = process.env.NODE_ENV === 'production';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Only invoke Supabase SSR token synchronization if request carries Supabase auth cookies
  // or accesses protected admin/auth paths. This prevents unnecessary Supabase calls on public
  // reader visits and guarantees zero tracking cookies are set on public readers.
  const hasAuthCookies = req.cookies.getAll().some((c) => c.name.startsWith('sb-'));
  const isAdminOrAuthRoute = pathname.startsWith('/admin') || pathname.startsWith('/auth');

  if ((hasAuthCookies || isAdminOrAuthRoute) && supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookieOptions: {
        path: '/',
        sameSite: 'lax',
        secure: isProduction,
        httpOnly: true,
      },
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            response.cookies.set(name, value, {
              ...options,
              path: '/',
              sameSite: 'lax',
              secure: isProduction,
              httpOnly: true,
            });
          });
        },
      },
    });

    // Refresh user session if token needs refreshing
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Route protection: /admin (except /admin/login) requires authenticated user
    const isProtectedAdminRoute = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
    if (isProtectedAdminRoute && !user) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      redirectUrl.searchParams.set('next', pathname);
      const redirectResponse = NextResponse.redirect(redirectUrl);
      response.cookies.getAll().forEach((c) => {
        redirectResponse.cookies.set(c);
      });
      applySecurityHeaders(redirectResponse, requestId, cspHeader);
      return redirectResponse;
    }
  }

  applySecurityHeaders(response, requestId, cspHeader);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static media files (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

