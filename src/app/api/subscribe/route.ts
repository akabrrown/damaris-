import { NextRequest, NextResponse } from 'next/server';
import { subscribeSchema } from '@/lib/schemas';
import { checkSubscribeRateLimit } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateConfirmToken } from '@/lib/tokens';
import { buildConfirmationEmail } from '@/lib/email-templates';
import { problemResponse } from '@/lib/api-response';
import { getEnv } from '@/lib/env';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  let rawEmail = '';
  let rawWebsite: string | undefined = undefined;
  const contentType = req.headers.get('content-type') || '';
  const isFormPost = contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data');

  if (isFormPost) {
    const formData = await req.formData();
    rawEmail = (formData.get('email') as string) || '';
    rawWebsite = (formData.get('website') as string) || undefined;
  } else {
    try {
      const body = await req.json();
      rawEmail = body.email || '';
      rawWebsite = body.website;
    } catch {
      return problemResponse(400, 'VALIDATION_FAILED', 'Invalid JSON', 'The request body could not be parsed.', undefined, requestId);
    }
  }

  // Validate with Zod
  const validation = subscribeSchema.safeParse({ email: rawEmail, website: rawWebsite });
  if (!validation.success) {
    if (isFormPost) {
      return NextResponse.redirect(new URL('/?error=invalid_email', req.url));
    }
    return problemResponse(
      400,
      'VALIDATION_FAILED',
      'Validation Failed',
      'Please enter a valid email address.',
      validation.error.flatten().fieldErrors,
      requestId
    );
  }

  const { email, website } = validation.data;

  // Bot honeypot triggered: return generic success without performing any action (Threat T1)
  if (website && website.length > 0) {
    if (isFormPost) {
      return NextResponse.redirect(new URL('/?subscribed=1', req.url));
    }
    return NextResponse.json(
      { message: 'Almost there. Check your inbox and press the confirmation link.' },
      { status: 202, headers: { 'x-request-id': requestId } }
    );
  }

  // Rate limiting per IP and email hash (Threat T1 / T2)
  const rateLimit = await checkSubscribeRateLimit(ip, email);
  if (!rateLimit.success) {
    if (isFormPost) {
      return NextResponse.redirect(new URL('/?error=rate_limited', req.url));
    }
    const extraHeaders: Record<string, string> = {};
    if (rateLimit.reset) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
      extraHeaders['Retry-After'] = retryAfterSeconds.toString();
    }
    return problemResponse(
      429,
      'RATE_LIMITED',
      'Rate Limit Exceeded',
      rateLimit.reason || 'Too many attempts. Please try again later.',
      undefined,
      requestId,
      extraHeaders
    );
  }

  const supabase = createAdminClient();
  const env = getEnv();

  // Check if subscriber exists
  const { data: existing } = await supabase
    .from('subscribers')
    .select('id, email, status, last_confirm_sent_at')
    .eq('email', email)
    .maybeSingle();

  const now = new Date();
  const nowMs = now.getTime();
  const oneHourMs = 60 * 60 * 1000;
  const expiresAt = new Date(nowMs + 48 * 60 * 60 * 1000).toISOString();

  let shouldSendEmail = false;
  let confirmTokenStr = '';

  if (existing) {
    if (existing.status === 'confirmed') {
      // Already confirmed: do not resend email, return generic 202 (prevent enumeration)
      shouldSendEmail = false;
    } else {
      // Pending or unsubscribed
      const lastSent = existing.last_confirm_sent_at ? new Date(existing.last_confirm_sent_at).getTime() : 0;
      // Allow sending at most once per hour
      if (nowMs - lastSent >= oneHourMs) {
        const { token, hash } = generateConfirmToken();
        confirmTokenStr = token;
        await supabase
          .from('subscribers')
          .update({
            status: 'pending',
            confirm_token_hash: hash,
            confirm_expires_at: expiresAt,
            last_confirm_sent_at: now.toISOString(),
          })
          .eq('id', existing.id);
        shouldSendEmail = true;
      }
    }
  } else {
    // New subscriber
    const { token, hash } = generateConfirmToken();
    confirmTokenStr = token;

    await supabase.from('subscribers').insert({
      email,
      status: 'pending',
      confirm_token_hash: hash,
      confirm_expires_at: expiresAt,
      last_confirm_sent_at: now.toISOString(),
      consented_at: now.toISOString(),
      source: 'web',
    });
    shouldSendEmail = true;
  }

  // Send double opt-in confirmation email if eligible
  if (shouldSendEmail && confirmTokenStr) {
    const confirmUrl = `${env.NEXT_PUBLIC_SITE_URL}/subscribe/confirm?token=${confirmTokenStr}`;

    // Load site settings for author name in email
    const { data: settings } = await supabase
      .from('site_settings')
      .select('author_name, site_title')
      .eq('id', 1)
      .maybeSingle();

    const authorName = settings?.author_name || 'Caroline Damaris Donkor';
    const siteTitle = settings?.site_title || 'Carolinedamaris';

    const emailContent = buildConfirmationEmail({
      confirmUrl,
      authorName,
      siteTitle,
    });

    try {
      if (env.RESEND_API_KEY && !env.RESEND_API_KEY.includes('dummy')) {
        const resend = new Resend(env.RESEND_API_KEY);
        await resend.emails.send({
          from: env.MAIL_FROM,
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
      } else {
        console.log(`[Dev Email Sink] Confirm link for ${email}: ${confirmUrl}`);
      }
    } catch (err) {
      console.error('Failed to send confirmation email via Resend:', err);
    }
  }

  if (isFormPost) {
    return NextResponse.redirect(new URL('/?subscribed=1', req.url));
  }

  return NextResponse.json(
    { message: 'Almost there. Check your inbox and press the confirmation link.' },
    { status: 202, headers: { 'x-request-id': requestId } }
  );
}
