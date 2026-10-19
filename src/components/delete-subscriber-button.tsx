'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { removeSubscriberAction } from '@/lib/actions/admin-actions';

interface DeleteSubscriberButtonProps {
  id: string;
  email: string;
}

export function DeleteSubscriberButton({ id, email }: DeleteSubscriberButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Permanently erase subscriber "${email}"? This action cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      try {
        await removeSubscriberAction(id);
        router.refresh();
      } catch (err) {
        alert((err as Error).message);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs text-alert hover:underline cursor-pointer min-h-[32px] px-2 py-1 disabled:opacity-50"
      title={`Permanently erase ${email}`}
      aria-label={`Permanently delete subscriber ${email}`}
    >
      {isPending ? 'Erasing…' : 'Delete'}
    </button>
  );
}
