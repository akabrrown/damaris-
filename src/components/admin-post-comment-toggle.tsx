'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { togglePostCommentsAction } from '@/lib/actions/comment-actions';

interface AdminPostCommentToggleProps {
  postId: string;
  allowComments: boolean;
}

export function AdminPostCommentToggle({
  postId,
  allowComments,
}: AdminPostCommentToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggle = (nextState: boolean) => {
    startTransition(async () => {
      try {
        await togglePostCommentsAction(postId, nextState);
        router.refresh();
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to toggle comments setting');
      }
    });
  };

  return (
    <label className="relative inline-flex items-center cursor-pointer select-none">
      <input
        type="checkbox"
        checked={allowComments}
        disabled={isPending}
        onChange={(e) => handleToggle(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-9 h-5 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-paper after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-moss" />
      <span className="ml-2 text-xs font-medium text-ink">
        {allowComments ? 'Allowed' : 'Disabled'}
      </span>
    </label>
  );
}
