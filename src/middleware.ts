import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
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

  // Clone response or proceed
  const response = NextResponse.next();

  // Security headers
  response.headers.set('x-request-id', requestId);
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
