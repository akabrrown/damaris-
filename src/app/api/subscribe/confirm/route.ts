import { NextRequest, NextResponse } from 'next/server';
import { confirmSchema } from '@/lib/schemas';
import { checkConfirmRateLimit } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashConfirmToken } from '@/lib/tokens';
import { problemResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  // Rate limit
  const rateLimit = await checkConfirmRateLimit(ip);
  if (!rateLimit.success) {
    return problemResponse(429, 'RATE_LIMITED', 'Too Many Requests', 'Too many confirmation attempts. Please try again later.', undefined, requestId);
  }

  let token = '';
  try {
    const body = await req.json();
    token = body.token;
  } catch {
    return problemResponse(400, 'VALIDATION_FAILED', 'Invalid JSON', 'Request body could not be parsed.', undefined, requestId);
  }

  const validation = confirmSchema.safeParse({ token });
  if (!validation.success) {
    return problemResponse(400, 'VALIDATION_FAILED', 'Invalid Token', 'The confirmation token is invalid.', undefined, requestId);
  }

  const tokenHash = hashConfirmToken(token);
  const supabase = createAdminClient();

  const { data: subscriber, error } = await supabase
    .from('subscribers')
    .select('id, email, status, confirm_expires_at')
    .eq('confirm_token_hash', tokenHash)
    .maybeSingle();

  if (error || !subscriber) {
    return problemResponse(404, 'TOKEN_INVALID', 'Invalid or Expired Link', 'This confirmation link is invalid or has already been used.', undefined, requestId);
  }

  // Check 48-hour expiration
  if (subscriber.confirm_expires_at && new Date(subscriber.confirm_expires_at) < new Date()) {
    return problemResponse(410, 'TOKEN_EXPIRED', 'Link Expired', 'This confirmation link has expired. Please enter your email again to receive a fresh link.', undefined, requestId);
  }

  // Mark confirmed and clear token so it cannot be used again
  await supabase
    .from('subscribers')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      confirm_token_hash: null,
      confirm_expires_at: null,
    })
    .eq('id', subscriber.id);

  return NextResponse.json(
    { status: 'confirmed', message: 'You are subscribed. Thank you for reading.' },
    { status: 200, headers: { 'x-request-id': requestId } }
  );
}
