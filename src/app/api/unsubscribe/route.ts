import { NextRequest, NextResponse } from 'next/server';
import { verifyUnsubscribeToken } from '@/lib/tokens';
import { createAdminClient } from '@/lib/supabase/admin';
import { problemResponse } from '@/lib/api-response';
import { getEnv } from '@/lib/env';

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const searchParams = req.nextUrl.searchParams;
  let token = searchParams.get('t') || '';

  if (!token) {
    try {
      const body = await req.json().catch(() => ({}));
      token = body.token || '';
    } catch {
      // Ignore body parsing failure
    }
  }

  if (!token) {
    return problemResponse(400, 'VALIDATION_FAILED', 'Missing Token', 'No unsubscribe token was provided.', undefined, requestId);
  }

  const env = getEnv();
  const subscriberId = verifyUnsubscribeToken(token, env.UNSUBSCRIBE_HMAC_SECRET);

  if (!subscriberId) {
    return problemResponse(404, 'TOKEN_INVALID', 'Invalid Link', 'This unsubscribe link is invalid or has expired.', undefined, requestId);
  }

  const supabase = createAdminClient();

  // Mark unsubscribed (idempotent action)
  await supabase
    .from('subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('id', subscriberId);

  return NextResponse.json(
    { status: 'unsubscribed', message: 'You have been unsubscribed and will not receive further emails.' },
    { status: 200, headers: { 'x-request-id': requestId } }
  );
}
