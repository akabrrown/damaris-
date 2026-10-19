'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { moderateCommentAction, deleteCommentAction } from '@/lib/actions/comment-actions';
import { CommentStatus } from '@/lib/types';
import { Check, ShieldAlert, Trash2 } from 'lucide-react';

interface AdminCommentRowActionsProps {
  commentId: string;
  currentStatus: CommentStatus;
}

export function AdminCommentRowActions({
  commentId,
  currentStatus,
}: AdminCommentRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleModerate = (status: CommentStatus) => {
    startTransition(async () => {
      try {
        await moderateCommentAction(commentId, status);
        router.refresh();
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to update status');
      }
    });
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to permanently delete this comment?')) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteCommentAction(commentId);
        router.refresh();
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to delete comment');
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {currentStatus !== 'approved' && (
        <button
          type="button"
          onClick={() => handleModerate('approved')}
          disabled={isPending}
          className="text-xs px-2.5 py-1 bg-moss text-paper hover:bg-moss/90 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
          title="Approve comment"
        >
          <Check className="w-3 h-3" aria-hidden="true" />
          <span>Approve</span>
        </button>
      )}

      {currentStatus !== 'spam' && (
        <button
          type="button"
          onClick={() => handleModerate('spam')}
          disabled={isPending}
          className="text-xs px-2.5 py-1 border border-line hover:border-alert text-muted hover:text-alert transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
          title="Mark as spam"
        >
          <ShieldAlert className="w-3 h-3" aria-hidden="true" />
          <span>Spam</span>
        </button>
      )}

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="text-xs p-1 text-muted hover:text-alert transition-colors cursor-pointer disabled:opacity-50"
        title="Delete comment permanently"
        aria-label="Delete comment"
      >
        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
