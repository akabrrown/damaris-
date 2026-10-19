import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface ResendWebhookData {
  id?: string;
  to?: string[];
  type?: string;
}

interface ResendWebhookEvent {
  id?: string;
  type?: string;
  data?: ResendWebhookData;
}

export async function POST(req: NextRequest) {
  let eventPayload: ResendWebhookEvent = {};
  try {
    eventPayload = (await req.json()) as ResendWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = eventPayload.type || '';
  const eventId = eventPayload.id || eventPayload.data?.id || crypto.randomUUID();
  const recipientEmail = eventPayload.data?.to?.[0];

  const supabase = createAdminClient();

  // Find subscriber by recipient email if available
  let subscriberId: string | null = null;
  if (recipientEmail) {
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('id')
      .eq('email', recipientEmail)
      .maybeSingle();

    if (subscriber) subscriberId = subscriber.id;
  }

  // Idempotently insert into email_events
  const { error: eventErr } = await supabase.from('email_events').insert({
    provider_event_id: eventId,
    type: eventType,
    subscriber_id: subscriberId,
    payload: eventPayload,
  });

  if (eventErr && eventErr.code === '23505') {
    // Unique violation (duplicate event already processed): return 200 safely
    return NextResponse.json({ message: 'Event already processed' }, { status: 200 });
  }

  // Update subscriber status if bounced or complained (FR-NTF-03)
  if (subscriberId) {
    if (eventType.includes('bounced')) {
      await supabase
        .from('subscribers')
        .update({ status: 'bounced' })
        .eq('id', subscriberId);
    } else if (eventType.includes('complained')) {
      await supabase
        .from('subscribers')
        .update({ status: 'complained' })
        .eq('id', subscriberId);
    }
  }

  return NextResponse.json({ received: true });
}
