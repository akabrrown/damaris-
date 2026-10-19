'use client';

import React, { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BookProgress, PublishStatus } from '@/lib/schemas';
import {
  createBookAction,
  updateBookAction,
  publishBookAction,
  unpublishBookAction,
  deleteBookAction,
} from '@/lib/actions/admin-actions';
import { MarkdownToolbar } from '@/components/markdown-toolbar';
import { generateExcerpt } from '@/lib/excerpt';
import { createClient } from '@/lib/supabase/client';

interface BookEditorProps {
  initialBook?: {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    synopsis_md: string;
    excerpt_md: string | null;
    cover_path: string | null;
    cover_alt: string | null;
    progress: BookProgress;
    purchase_url: string | null;
    release_date: string | null;
    sort_order: number;
    status: PublishStatus;
  };
  confirmedSubscribersCount: number;
}

export function BookEditor({ initialBook, confirmedSubscribersCount }: BookEditorProps) {
  const router = useRouter();

  const [id, setId] = useState(initialBook?.id || '');
  const [title, setTitle] = useState(initialBook?.title || '');
  const [subtitle, setSubtitle] = useState(initialBook?.subtitle || '');
  const [slug, setSlug] = useState(initialBook?.slug || '');
  const [synopsisMd, setSynopsisMd] = useState(initialBook?.synopsis_md || '');
  const [excerptMd, setExcerptMd] = useState(initialBook?.excerpt_md || '');
  const [coverPath, setCoverPath] = useState(initialBook?.cover_path || '');
  const [coverAlt, setCoverAlt] = useState(initialBook?.cover_alt || '');
  const [progress, setProgress] = useState<BookProgress>(initialBook?.progress || 'upcoming');
  const [purchaseUrl, setPurchaseUrl] = useState(initialBook?.purchase_url || '');
  const [releaseDate, setReleaseDate] = useState(initialBook?.release_date || '');
  const [sortOrder, setSortOrder] = useState(initialBook?.sort_order ?? 0);
  const [status, setStatus] = useState<PublishStatus>(initialBook?.status || 'draft');

  const [uploadingImage, setUploadingImage] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [notifySubscribers, setNotifySubscribers] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const synopsisRef = useRef<HTMLTextAreaElement | null>(null);
  const excerptRef = useRef<HTMLTextAreaElement | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 2 MB limit.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage('Only JPEG, PNG, or WebP images are permitted.');
      return;
    }

    setUploadingImage(true);
    setErrorMessage('');

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'webp';
      const path = `covers/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

      const { data, error } = await supabase.storage.from('media').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(data.path);
      setCoverPath(publicUrlData.publicUrl);
    } catch (err: unknown) {
      setErrorMessage(`Upload failed: ${(err as Error).message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setErrorMessage('');
    if (coverPath && !coverAlt.trim()) {
      setErrorMessage('Cover image alt text is required whenever a cover is uploaded.');
      return;
    }

    startTransition(async () => {
      try {
        if (!id) {
          const created = await createBookAction({
            title,
            subtitle: subtitle || undefined,
            slug: slug || undefined,
            synopsis_md: synopsisMd,
            excerpt_md: excerptMd || undefined,
            cover_path: coverPath || undefined,
            cover_alt: coverAlt || undefined,
            progress,
            purchase_url: purchaseUrl || undefined,
            release_date: releaseDate || undefined,
            sort_order: Number(sortOrder) || 0,
            status: 'draft',
            notify: false,
          });
          setId(created.id);
          router.replace(`/admin/books/${created.id}`);
        } else {
          await updateBookAction(id, {
            title,
            subtitle: subtitle || null,
            slug: slug || undefined,
            synopsis_md: synopsisMd,
            excerpt_md: excerptMd || null,
            cover_path: coverPath || null,
            cover_alt: coverAlt || null,
            progress,
            purchase_url: purchaseUrl || null,
            release_date: releaseDate || null,
            sort_order: Number(sortOrder) || 0,
          });
          router.refresh();
        }
      } catch (err: unknown) {
        setErrorMessage((err as Error).message);
      }
    });
  };

  const handlePublish = async () => {
    if (!id) {
      setErrorMessage('Please save the book first before publishing.');
      return;
    }

    startTransition(async () => {
      try {
        await publishBookAction(id, notifySubscribers);
        setStatus('published');
        setPublishDialogOpen(false);
        router.refresh();
      } catch (err: unknown) {
        setErrorMessage((err as Error).message);
      }
    });
  };

  const handleUnpublish = async () => {
    if (!confirm(`Are you sure you want to unpublish "${title}"? It will be removed from public view.`)) return;
    startTransition(async () => {
      try {
        await unpublishBookAction(id);
        setStatus('draft');
        router.refresh();
      } catch (err: unknown) {
        setErrorMessage((err as Error).message);
      }
    });
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteBookAction(id);
        router.push('/admin/books');
      } catch (err: unknown) {
        setErrorMessage((err as Error).message);
      }
    });
  };

  return (
    <div className="space-y-8 max-w-4xl pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center space-x-3">
          <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 bg-sage-soft border border-line">
            {status}
          </span>
          <span className="text-xs uppercase tracking-wider text-muted font-medium">
            Status: {progress}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {status === 'published' && slug && (
            <a
              href={`/books/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-moss hover:text-ink underline py-1"
            >
              View on site &rarr;
            </a>
          )}
          {id && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-alert hover:underline cursor-pointer"
            >
              Delete Book
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div role="alert" className="p-4 bg-paper-deep border border-alert text-alert text-sm">
          {errorMessage}
        </div>
      )}

      {/* Editor Form */}
      <div className="space-y-6 bg-paper p-6 sm:p-8 border border-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="book-title" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
              Book Title *
            </label>
            <input
              type="text"
              id="book-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-paper border border-ink text-ink font-serif text-xl rounded-none"
            />
          </div>

          <div>
            <label htmlFor="book-subtitle" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
              Subtitle (Optional)
            </label>
            <input
              type="text"
              id="book-subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 bg-paper border border-ink text-ink text-base rounded-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="book-slug" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
            URL Slug {status === 'published' && '(Frozen after publication)'}
          </label>
          <input
            type="text"
            id="book-slug"
            disabled={status === 'published'}
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="book-slug"
            className="w-full px-3 py-2 bg-paper-deep border border-line text-sm text-ink font-mono disabled:opacity-60"
          />
        </div>

        {/* Progress & Order */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label htmlFor="book-progress" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
              Progress State
            </label>
            <select
              id="book-progress"
              value={progress}
              onChange={(e) => setProgress(e.target.value as BookProgress)}
              className="w-full px-3 py-2 bg-paper border border-ink text-ink text-sm rounded-none"
            >
              <option value="upcoming">Upcoming</option>
              <option value="in_progress">In Progress</option>
              <option value="available">Available Now</option>
            </select>
          </div>

          <div>
            <label htmlFor="book-date" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
              Release Date (Optional)
            </label>
            <input
              type="date"
              id="book-date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="w-full px-3 py-2 bg-paper border border-ink text-ink text-sm rounded-none"
            />
          </div>

          <div>
            <label htmlFor="book-sort" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
              Sort Order (0, 1, 2...)
            </label>
            <input
              type="number"
              id="book-sort"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 bg-paper border border-ink text-ink text-sm rounded-none"
            />
          </div>
        </div>

        {/* Purchase URL */}
        <div>
          <label htmlFor="book-purchase" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
            Purchase / Read Online Link (Must begin with https://)
          </label>
          <input
            type="url"
            id="book-purchase"
            value={purchaseUrl}
            onChange={(e) => setPurchaseUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 bg-paper border border-ink text-ink text-sm rounded-none"
          />
        </div>

        {/* Cover Upload */}
        <div className="p-4 bg-paper-deep border border-line space-y-4">
          <span className="text-xs uppercase tracking-wider text-muted font-semibold block">
            Book Cover Image (Max 2 MB &middot; JPEG, PNG, or WebP)
          </span>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            disabled={uploadingImage}
            className="text-sm file:mr-4 file:py-2 file:px-4 file:border file:border-ink file:bg-sage file:text-xs file:font-semibold"
          />
          {uploadingImage && <p className="text-xs text-muted">Uploading image to storage…</p>}

          {coverPath && (
            <div className="space-y-3">
              <p className="text-xs text-muted">Current Cover: {coverPath}</p>
              <div>
                <label htmlFor="cover-alt" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
                  Cover Alt Text * (Required for accessibility)
                </label>
                <input
                  type="text"
                  id="cover-alt"
                  required
                  value={coverAlt}
                  onChange={(e) => setCoverAlt(e.target.value)}
                  placeholder="e.g. Front cover of The Quiet River showing a misty tree"
                  className="w-full px-3 py-2 bg-paper border border-ink text-ink text-sm rounded-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Synopsis Markdown */}
        <div>
          <label htmlFor="book-synopsis" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
            Synopsis (Markdown) *
          </label>
          <MarkdownToolbar
            textareaRef={synopsisRef}
            value={synopsisMd}
            onChange={setSynopsisMd}
          />
          <textarea
            ref={synopsisRef}
            id="book-synopsis"
            rows={8}
            required
            value={synopsisMd}
            onChange={(e) => setSynopsisMd(e.target.value)}
            placeholder="Full book synopsis..."
            className="w-full p-3 bg-paper border border-ink text-ink text-base rounded-none font-sans"
          />
        </div>

        {/* Excerpt Markdown */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <label htmlFor="book-excerpt" className="block text-xs uppercase tracking-wider text-muted font-medium">
              Excerpt (Optional)
            </label>
            {synopsisMd.trim() && (
              <button
                type="button"
                onClick={() => {
                  setExcerptMd(generateExcerpt(synopsisMd, 'story', 400));
                }}
                className="text-xs text-moss hover:text-ink hover:underline cursor-pointer"
                title="Autogenerate excerpt teaser from synopsis"
              >
                ↻ Generate teaser from synopsis
              </button>
            )}
          </div>
          <MarkdownToolbar
            textareaRef={excerptRef}
            value={excerptMd}
            onChange={setExcerptMd}
          />
          <textarea
            ref={excerptRef}
            id="book-excerpt"
            rows={10}
            value={excerptMd}
            onChange={(e) => setExcerptMd(e.target.value)}
            placeholder="Sample poem, opening chapter, or excerpt..."
            className="w-full p-3 bg-paper border border-line text-ink text-base rounded-none font-sans"
          />
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-paper-deep border-t border-ink/40 p-4 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-6 py-3 border border-ink bg-paper hover:bg-paper-deep text-ink text-sm font-medium transition-colors cursor-pointer"
          >
            {isPending ? 'Saving…' : 'Save Book'}
          </button>

          {status === 'published' && id && (
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={isPending}
              className="px-6 py-3 bg-paper border border-line text-muted hover:text-ink hover:bg-paper-deep text-sm transition-colors cursor-pointer"
            >
              {isPending ? 'Updating…' : 'Unpublish to Draft'}
            </button>
          )}

          {status !== 'published' && id && (
            <button
              type="button"
              onClick={() => setPublishDialogOpen(true)}
              disabled={isPending}
              className="px-8 py-3 bg-sage hover:bg-sage/80 border border-ink text-ink font-semibold text-sm transition-colors cursor-pointer"
            >
              Publish Book…
            </button>
          )}
        </div>
      </div>

      {/* Publish Dialog */}
      {publishDialogOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-book-title"
            className="bg-paper border border-ink p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-md"
          >
            <h2 id="publish-book-title" className="font-serif text-2xl text-ink font-normal">
              Publish &ldquo;{title}&rdquo;?
            </h2>

            <div className="p-4 bg-sage-soft border border-line space-y-2">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifySubscribers}
                  onChange={(e) => setNotifySubscribers(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-moss"
                />
                <div>
                  <span className="text-sm font-medium text-ink block">
                    Email confirmed subscribers
                  </span>
                  <span className="text-xs text-muted block">
                    {confirmedSubscribersCount} confirmed subscriber{confirmedSubscribersCount === 1 ? '' : 's'} will receive an update email once.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-line">
              <button
                type="button"
                onClick={() => setPublishDialogOpen(false)}
                className="px-4 py-2 text-sm text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPending}
                className="px-6 py-2 bg-sage hover:bg-sage/80 border border-ink text-ink font-medium text-sm transition-colors"
              >
                {isPending ? 'Publishing…' : 'Confirm Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
