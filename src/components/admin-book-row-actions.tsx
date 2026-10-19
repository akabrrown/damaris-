'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteBookAction, unpublishBookAction, publishBookAction } from '@/lib/actions/admin-actions';
import { PublishStatus } from '@/lib/schemas';

interface AdminBookRowActionsProps {
  id: string;
  slug: string;
  title: string;
  status: PublishStatus;
}

export function AdminBookRowActions({
  id,
  slug,
  title,
  status,
}: AdminBookRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to permanently delete book "${title}"? This cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteBookAction(id);
        router.refresh();
      } catch (err) {
        alert((err as Error).message);
      }
    });
  };

  const handleTogglePublish = () => {
    startTransition(async () => {
      try {
        if (status === 'published') {
          if (!confirm(`Unpublish book "${title}"? It will become a draft and hide from public view.`)) return;
          await unpublishBookAction(id);
        } else {
          // Publish without auto-sending emails from quick list toggle (safe)
          await publishBookAction(id, false);
        }
        router.refresh();
      } catch (err) {
        alert((err as Error).message);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {status === 'published' && (
        <Link
          href={`/books/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-moss hover:text-ink underline px-2 py-1"
        >
          View &rarr;
        </Link>
      )}

      <button
        type="button"
        onClick={handleTogglePublish}
        disabled={isPending}
        className={`px-2.5 py-1 border transition-colors cursor-pointer ${
          status === 'published'
            ? 'border-line bg-paper hover:bg-paper-deep text-muted'
            : 'border-moss bg-sage-soft hover:bg-sage text-ink font-medium'
        }`}
        title={status === 'published' ? 'Unpublish back to draft' : 'Publish book'}
      >
        {isPending ? '…' : status === 'published' ? 'Unpublish' : 'Publish'}
      </button>

      <Link
        href={`/admin/books/${id}`}
        className="px-3 py-1 bg-sage/60 hover:bg-sage border border-ink text-ink font-medium transition-colors"
      >
        Edit
      </Link>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="px-2.5 py-1 text-alert hover:underline cursor-pointer disabled:opacity-50"
        title={`Delete book "${title}"`}
      >
        {isPending ? '…' : 'Delete'}
      </button>
    </div>
  );
}
