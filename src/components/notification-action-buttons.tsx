'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { retryFailedDeliveriesAction, sendNotificationNowAction } from '@/lib/actions/notification-actions';

interface NotificationActionButtonsProps {
  id: string;
  status: string;
  failedCount: number;
}

export function NotificationActionButtons({
  id,
  status,
  failedCount,
}: NotificationActionButtonsProps) {
  const router = useRouter();
  const [isRetrying, startRetry] = useTransition();
  const [isSending, startSend] = useTransition();

  const handleRetry = () => {
    startRetry(async () => {
      try {
        await retryFailedDeliveriesAction(id);
        router.refresh();
      } catch (err) {
        alert((err as Error).message);
      }
    });
  };

  const handleSendNow = () => {
    startSend(async () => {
      try {
        await sendNotificationNowAction(id);
        router.refresh();
      } catch (err) {
        alert((err as Error).message);
      }
    });
  };

  return (
    <div className="flex items-center space-x-3">
      {failedCount > 0 && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying || isSending}
          className="px-4 py-2 bg-sage hover:bg-sage/80 border border-ink text-ink text-xs font-medium cursor-pointer disabled:opacity-50 transition-colors"
        >
          {isRetrying ? 'Retrying…' : `Retry ${failedCount} Failed Deliveries`}
        </button>
      )}

      {status === 'pending' && (
        <button
          type="button"
          onClick={handleSendNow}
          disabled={isRetrying || isSending}
          className="px-4 py-2 bg-sage hover:bg-sage/80 border border-ink text-ink text-xs font-medium cursor-pointer disabled:opacity-50 transition-colors"
        >
          {isSending ? 'Sending…' : 'Send Now'}
        </button>
      )}
    </div>
  );
}
