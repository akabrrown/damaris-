import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { getEnv } from '@/lib/env';
import { processNotificationDeliveries } from '@/lib/notification-worker';

export async function POST(req: NextRequest) {
  const env = getEnv();
  const rawBody = await req.text();

  // Signature verification (Threat T9) when production signing keys are configured
  if (
    env.QSTASH_CURRENT_SIGNING_KEY &&
    !env.QSTASH_CURRENT_SIGNING_KEY.includes('dummy') &&
    env.QSTASH_NEXT_SIGNING_KEY &&
    !env.QSTASH_NEXT_SIGNING_KEY.includes('dummy')
  ) {
    const receiver = new Receiver({
      currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
    });

    const signature = req.headers.get('upstash-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing QStash signature' }, { status: 401 });
    }

    const isValid = await receiver.verify({
      signature,
      body: rawBody,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid QStash signature' }, { status: 401 });
    }
  }

  let notificationId = '';
  try {
    const body = JSON.parse(rawBody);
    notificationId = body.notificationId;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!notificationId) {
    return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 });
  }

  const result = await processNotificationDeliveries(notificationId);

  if (result.status === 'not_found') {
    return NextResponse.json({ error: result.message }, { status: 404 });
  }

  if (result.status === 'done') {
    return NextResponse.json({ message: result.message, status: 'done' }, { status: 200 });
  }

  // If unsent deliveries remain, return 503 so QStash retries with exponential back-off
  return NextResponse.json(
    {
      message: result.message,
      remaining: result.remaining,
      failedInBatch: result.failedInBatch,
    },
    { status: 503 }
  );
}
