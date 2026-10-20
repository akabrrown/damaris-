'use client';

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PostKind, PublishStatus } from '@/lib/schemas';
import {
  createPostAction,
  updatePostAction,
  publishPostAction,
  unpublishPostAction,
  deletePostAction,
  uploadMediaAction,
} from '@/lib/actions/admin-actions';
import { generateSlug } from '@/lib/slug';
import { generateExcerpt } from '@/lib/excerpt';
import {
  MarkdownToolbar,
  wrapSelectionInTextarea,
  prefixLinesInTextarea,
  outdentLinesInTextarea,
} from '@/components/markdown-toolbar';
import { renderVerse, renderVerseLineHtml, sanitizeMarkdown } from '@/lib/content-renderer';
import { getPiecePath } from '@/lib/routing';
import { Edit3, Eye, Columns2, HelpCircle, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';


interface PostEditorProps {
  initialPost?: {
    id: string;
    kind: PostKind;
    title: string | null;
    slug: string;
    body_md: string;
    excerpt: string | null;
    attribution: string | null;
    allow_comments?: boolean;
    status: PublishStatus;
    featured_image_path?: string | null;
    featured_image_alt?: string | null;
    featured_image_caption?: string | null;
  };
  defaultKind?: PostKind;
  confirmedSubscribersCount: number;
}

export function PostEditor({
  initialPost,
  defaultKind = 'poem',
  confirmedSubscribersCount,
}: PostEditorProps) {
  const router = useRouter();

  const [id, setId] = useState(initialPost?.id || '');
  const [kind, setKind] = useState<PostKind>(initialPost?.kind || defaultKind);
  const [title, setTitle] = useState(initialPost?.title || '');
  const [slug, setSlug] = useState(initialPost?.slug || '');
  const [bodyMd, setBodyMd] = useState(initialPost?.body_md || '');
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || '');
  const [isCustomExcerpt, setIsCustomExcerpt] = useState(Boolean(initialPost?.excerpt));
  const [attribution, setAttribution] = useState(initialPost?.attribution || '');
  const [allowComments, setAllowComments] = useState<boolean>(initialPost?.allow_comments ?? true);
  const [status, setStatus] = useState<PublishStatus>(initialPost?.status || 'draft');
  const [featuredImagePath, setFeaturedImagePath] = useState(initialPost?.featured_image_path || '');
  const [featuredImageAlt, setFeaturedImageAlt] = useState(initialPost?.featured_image_alt || '');
  const [featuredImageCaption, setFeaturedImageCaption] = useState(initialPost?.featured_image_caption || '');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleBodyChange = (newBody: string) => {
    setBodyMd(newBody);
    if (!isCustomExcerpt) {
      setExcerpt(generateExcerpt(newBody, kind));
    }
  };

  // Autosave status state
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [notifySubscribers, setNotifySubscribers] = useState(kind !== 'quote'); // Default off for quotes (PRD FR-NTF-01)
  const [isPending, startTransition] = useTransition();

  // Rich editing & live preview state
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [viewMode, setViewMode] = useState<'write' | 'split' | 'preview'>('write');
  const [showGuide, setShowGuide] = useState(false);

  // Keyboard formatting shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMac = typeof window !== 'undefined' && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (modifier && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      wrapSelectionInTextarea(textarea, bodyMd, '**', '**', 'bold text', setBodyMd);
    } else if (modifier && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      wrapSelectionInTextarea(textarea, bodyMd, '*', '*', 'italic text', setBodyMd);
    } else if (modifier && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = bodyMd.slice(start, end);
      const url = window.prompt('Enter target URL (e.g. https://...):', 'https://');
      if (url) {
        const linkText = selected.trim() || 'Link description';
        const replacement = `[${linkText}](${url.trim()})`;
        const nextValue = bodyMd.slice(0, start) + replacement + bodyMd.slice(end);
        setBodyMd(nextValue);
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(start, start + replacement.length);
        });
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        outdentLinesInTextarea(textarea, bodyMd, 4, setBodyMd);
      } else {
        prefixLinesInTextarea(textarea, bodyMd, '    ', setBodyMd);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 10 MB limit.');
      return;
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
    if (!allowedMimeTypes.includes(file.type)) {
      setErrorMessage('Only JPEG, PNG, WebP, AVIF, or GIF images are permitted.');
      return;
    }

    setUploadingImage(true);
    setErrorMessage('');

    try {
      // Primary: Server-side authenticated upload (immune to browser cookie/session token mismatches)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'posts');

      const res = await uploadMediaAction(formData);
      setFeaturedImagePath(res.publicUrl);
    } catch (err: unknown) {
      console.warn('Server upload action returned error, attempting client-side fallback:', err);
      try {
        const supabase = createClient();
        const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
        const path = `posts/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

        const { data, error } = await supabase.storage.from('media').upload(path, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(data.path);
        setFeaturedImagePath(publicUrlData.publicUrl);
      } catch (clientErr: unknown) {
        setErrorMessage(`Upload failed: ${(err as Error).message || (clientErr as Error).message}`);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const renderLivePreview = () => {
    if (!bodyMd.trim()) {
      return (
        <div className="py-12 text-center text-muted italic text-sm">
          Content written will appear here in real-time, styled exactly as visitors see it.
        </div>
      );
    }

    if (kind === 'poem') {
      const stanzas = renderVerse(bodyMd);
      return (
        <article className="max-w-[36ch] mx-auto py-2">
          {title && (
            <header className="mb-6 text-left border-b border-line/50 pb-3">
              <span className="text-xs uppercase tracking-wider text-muted block mb-1">Poem &middot; Reader View</span>
              <h2 className="font-serif text-2xl sm:text-3xl text-ink font-normal">{title}</h2>
            </header>
          )}

          {featuredImagePath && (
            <figure className="my-6 flex flex-col items-center">
              <div className="w-full max-w-[190px] sm:max-w-[250px] md:max-w-[320px] p-1.5 sm:p-2 bg-paper/60 border border-ink/25 shadow-xs">
                <div className="w-full aspect-[4/3] overflow-hidden border border-ink/15 bg-paper-deep">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredImagePath}
                    alt={featuredImageAlt || 'Poem artwork'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {featuredImageCaption && (
                <figcaption className="text-xs text-muted font-sans italic text-center mt-2.5 max-w-[280px]">
                  {featuredImageCaption}
                </figcaption>
              )}
            </figure>
          )}

          <div className="poem-block text-ink text-left space-y-6 sm:space-y-8 my-4">
            {stanzas.map((stanza, sIdx) => (
              <p key={sIdx} className="m-0">
                {stanza.map((line, lIdx) => (
                  <span
                    key={lIdx}
                    className="poem-line block"
                    dangerouslySetInnerHTML={{ __html: renderVerseLineHtml(line) }}
                  />
                ))}
              </p>
            ))}
          </div>
        </article>
      );
    }

    if (kind === 'quote') {
      return (
        <article className="max-w-[52ch] mx-auto py-8 text-center">
          <blockquote className="font-serif italic text-2xl sm:text-3xl text-ink leading-relaxed font-normal">
            &ldquo;{bodyMd}&rdquo;
          </blockquote>
          {attribution && (
            <p className="mt-4 text-sm uppercase tracking-wider text-muted font-medium">
              — {attribution}
            </p>
          )}
        </article>
      );
    }

    return (
      <article className="max-w-[62ch] mx-auto py-2">
        {title && (
          <header className="mb-6 border-b border-line/50 pb-3">
            <span className="text-xs uppercase tracking-wider text-muted block mb-1">
              {kind === 'story' ? 'Short Story' : 'Reflection'} &middot; Reader View
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-ink font-normal">{title}</h2>
          </header>
        )}

        {featuredImagePath && (
          <figure className="my-6 flex flex-col items-center">
            <div className="w-full max-w-[280px] sm:max-w-[440px] md:max-w-[580px] p-1.5 sm:p-2 bg-paper/60 border border-ink/25 shadow-xs">
              <div className="w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden border border-ink/15 bg-paper-deep">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredImagePath}
                  alt={featuredImageAlt || title || 'Featured image'}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {featuredImageCaption && (
              <figcaption className="text-xs text-muted font-sans italic text-center mt-2.5 max-w-md">
                {featuredImageCaption}
              </figcaption>
            )}
          </figure>
        )}

        <div
          className="prose-reading leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeMarkdown(bodyMd) }}
        />
      </article>
    );
  };

  const handleAutoSave = React.useCallback(async () => {
    if (!id || !bodyMd.trim()) return;
    // Don't auto-save with featured image if alt text is missing (required by schema)
    if (featuredImagePath && !featuredImageAlt.trim()) return;

    setSaveState('saving');
    const finalExcerpt = excerpt.trim() || generateExcerpt(bodyMd, kind) || undefined;
    try {
      await updatePostAction(id, {
        title: title || undefined,
        body_md: bodyMd,
        excerpt: finalExcerpt,
        attribution: attribution || undefined,
        slug: slug || undefined,
        allow_comments: allowComments,
        featured_image_path: featuredImagePath || null,
        featured_image_alt: featuredImageAlt || null,
        featured_image_caption: featuredImageCaption || null,
      });
      setSaveState('saved');
    } catch {
      setSaveState('unsaved');
    }
  }, [id, title, bodyMd, excerpt, attribution, slug, kind, allowComments, featuredImagePath, featuredImageAlt, featuredImageCaption]);

  // Autosave timer
  useEffect(() => {
    if (!id || status === 'published') return;

    setSaveState('unsaved');
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 4000);

    return () => clearTimeout(timer);
  }, [id, status, handleAutoSave]);

  const handleSave = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    let resolvedAlt = featuredImageAlt.trim();
    if (featuredImagePath && !resolvedAlt) {
      resolvedAlt = title.trim() ? `Featured artwork for ${title.trim()}` : 'Featured artwork';
      setFeaturedImageAlt(resolvedAlt);
    }

    const finalExcerpt = excerpt.trim() || generateExcerpt(bodyMd, kind) || undefined;
    startTransition(async () => {
      try {
        if (!id) {
          const created = await createPostAction({
            kind,
            title: title || undefined,
            body_md: bodyMd || ' ',
            excerpt: finalExcerpt,
            attribution: attribution || undefined,
            slug: slug || generateSlug(title || 'item'),
            allow_comments: allowComments,
            featured_image_path: featuredImagePath || undefined,
            featured_image_alt: resolvedAlt || undefined,
            featured_image_caption: featuredImageCaption || undefined,
            status: 'draft',
            notify: false,
          });
          setId(created.id);
          setSuccessMessage('Draft created successfully!');
          router.replace(`/admin/posts/${created.id}`);
        } else {
          await updatePostAction(id, {
            title: title || undefined,
            body_md: bodyMd,
            excerpt: finalExcerpt,
            attribution: attribution || undefined,
            slug: slug || undefined,
            allow_comments: allowComments,
            featured_image_path: featuredImagePath || null,
            featured_image_alt: resolvedAlt || null,
            featured_image_caption: featuredImageCaption || null,
          });
          setSuccessMessage(status === 'published' ? 'Changes saved and updated live!' : 'Changes saved successfully!');
          router.refresh();
        }
        setSaveState('saved');
        setTimeout(() => setSuccessMessage(''), 5000);
      } catch (err: unknown) {
        setErrorMessage((err as Error).message);
      }
    });
  };

  const handlePublish = async () => {
    setErrorMessage('');
    if (!id) {
      setErrorMessage('Please save the draft first before publishing.');
      return;
    }

    startTransition(async () => {
      try {
        await publishPostAction(id, notifySubscribers);
        setStatus('published');
        setPublishDialogOpen(false);
        router.refresh();
      } catch (err: unknown) {
        setErrorMessage((err as Error).message);
      }
    });
  };

  const handleUnpublish = async () => {
    if (!confirm('Are you sure you want to unpublish this piece? It will be removed from public view.')) {
      return;
    }
    startTransition(async () => {
      try {
        await unpublishPostAction(id);
        setStatus('draft');
        router.refresh();
      } catch (err: unknown) {
        setErrorMessage((err as Error).message);
      }
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this piece? This action cannot be undone.')) {
      return;
    }
    startTransition(async () => {
      try {
        await deletePostAction(id);
        router.push('/admin/posts');
      } catch (err: unknown) {
        setErrorMessage((err as Error).message);
      }
    });
  };

  const quoteLength = bodyMd.length;

  return (
    <div className="space-y-8 max-w-4xl pb-24">
      {/* Top Status & Controls */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center space-x-3">
          <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 bg-sage-soft border border-line">
            {status}
          </span>
          <span className="text-xs text-muted">
            {saveState === 'saved' && '✓ All changes saved'}
            {saveState === 'saving' && 'Saving draft…'}
            {saveState === 'unsaved' && '● Unsaved changes'}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {id && status === 'published' && (
            <a
              href={getPiecePath(kind, slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-moss hover:text-ink underline py-2 font-medium"
            >
              View live piece &rarr;
            </a>
          )}
          {id && status !== 'published' && (
            <a
              href={`/admin/posts/${id}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-moss hover:text-ink underline py-2"
            >
              Preview draft &rarr;
            </a>
          )}
          {id && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-alert hover:underline cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div role="alert" className="p-4 bg-paper-deep border border-alert text-alert text-sm">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div role="status" className="p-4 bg-sage/20 border border-moss text-ink text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-moss">✓</span>
            <span>{successMessage}</span>
          </div>
          {id && status === 'published' && (
            <a
              href={getPiecePath(kind, slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-moss hover:underline underline ml-4"
            >
              View live piece &rarr;
            </a>
          )}
        </div>
      )}

      {/* Editor Form */}
      <div className="space-y-6 bg-paper p-6 sm:p-8 border border-line">
        {/* Kind Selector */}
        {!id && (
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted font-medium mb-2">
              Kind of Writing
            </label>
            <div className="flex flex-wrap gap-3">
              {(['poem', 'story', 'reflection', 'quote'] as PostKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setKind(k);
                    setNotifySubscribers(k !== 'quote');
                    if (!isCustomExcerpt && bodyMd) {
                      setExcerpt(generateExcerpt(bodyMd, k));
                    }
                  }}
                  className={`px-4 py-2 text-sm font-medium border ${
                    kind === k
                      ? 'bg-sage border-ink text-ink font-semibold'
                      : 'bg-paper-deep border-line text-muted hover:text-ink'
                  }`}
                >
                  {k === 'poem' ? 'Poem' : k === 'story' ? 'Short Story' : k === 'reflection' ? 'Reflection' : 'Quote'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Title (for poems, stories, reflections) */}
        {kind !== 'quote' && (
          <div>
            <label htmlFor="post-title" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
              Title
            </label>
            <input
              type="text"
              id="post-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slug || status === 'draft') {
                  setSlug(generateSlug(e.target.value));
                }
              }}
              placeholder="Title of piece"
              className="w-full px-4 py-3 bg-paper border border-ink text-ink font-serif text-2xl rounded-none focus:outline-2 focus:outline-moss"
            />
          </div>
        )}

        {/* Slug (URL segment) */}
        <div>
          <label htmlFor="post-slug" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
            URL Slug {status === 'published' && '(Frozen after publication)'}
          </label>
          <input
            type="text"
            id="post-slug"
            value={slug}
            disabled={status === 'published'}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="url-slug"
            className="w-full px-3 py-2 bg-paper-deep border border-line text-sm text-ink font-mono disabled:opacity-60"
          />
        </div>

        {/* Body Editor with Formatting Tools & Live Preview */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-3">
              <label htmlFor="post-body" className="block text-xs uppercase tracking-wider text-muted font-medium">
                {kind === 'poem'
                  ? 'Poem Verses (Line breaks and stanzas preserved)'
                  : kind === 'quote'
                  ? 'Quote Text'
                  : 'Markdown Content'}
              </label>

              {kind === 'quote' && (
                <span className={`text-xs ${quoteLength > 600 ? 'text-alert font-bold' : 'text-muted'}`}>
                  {quoteLength} / 600 characters max
                </span>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center space-x-1 bg-paper-deep border border-line p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('write')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                  viewMode === 'write' ? 'bg-paper text-ink shadow-xs border border-line/70' : 'text-muted hover:text-ink'
                }`}
                title="Write mode"
              >
                <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Write</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                  viewMode === 'split' ? 'bg-paper text-ink shadow-xs border border-line/70' : 'text-muted hover:text-ink'
                }`}
                title="Side-by-side write and preview"
              >
                <Columns2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Split View</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                  viewMode === 'preview' ? 'bg-paper text-ink shadow-xs border border-line/70' : 'text-muted hover:text-ink'
                }`}
                title="Full reader preview mode"
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Preview</span>
              </button>
            </div>
          </div>

          {/* Editor Layout based on View Mode */}
          {viewMode === 'preview' ? (
            <div className="border border-line bg-paper p-6 sm:p-10 min-h-[400px]">
              <div className="text-[11px] uppercase tracking-wider text-muted font-mono mb-6 pb-2 border-b border-line flex items-center justify-between">
                <span>Public Reader View</span>
                <span>Matches live visitor experience</span>
              </div>
              {renderLivePreview()}
            </div>
          ) : viewMode === 'split' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <MarkdownToolbar
                  textareaRef={textareaRef}
                  value={bodyMd}
                  onChange={handleBodyChange}
                  kind={kind}
                />
                <textarea
                  ref={textareaRef}
                  id="post-body"
                  rows={kind === 'quote' ? 8 : 20}
                  value={bodyMd}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  placeholder={
                    kind === 'poem'
                      ? 'Type poem lines here...\nUse single line breaks between lines,\nand blank lines between stanzas.'
                      : kind === 'quote'
                      ? 'Type the short quote here (maximum 600 characters)...'
                      : 'Write your story or reflection in Markdown...'
                  }
                  className={`w-full p-4 bg-paper border border-ink text-ink text-base leading-relaxed rounded-none focus:outline-2 focus:outline-moss ${
                    kind === 'poem' ? 'font-serif' : 'font-sans'
                  }`}
                />
              </div>

              <div className="border border-line bg-paper p-6 overflow-y-auto max-h-[580px]">
                <div className="text-[11px] uppercase tracking-wider text-muted font-mono mb-4 pb-2 border-b border-line flex items-center justify-between">
                  <span>Live Reader Preview</span>
                  <span>Instant</span>
                </div>
                {renderLivePreview()}
              </div>
            </div>
          ) : (
            <div>
              <MarkdownToolbar
                textareaRef={textareaRef}
                value={bodyMd}
                onChange={handleBodyChange}
                kind={kind}
              />
              <textarea
                ref={textareaRef}
                id="post-body"
                rows={kind === 'quote' ? 6 : 18}
                value={bodyMd}
                onKeyDown={handleKeyDown}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder={
                  kind === 'poem'
                    ? 'Type poem lines here...\nUse single line breaks between lines,\nand blank lines between stanzas.'
                    : kind === 'quote'
                    ? 'Type the short quote here (maximum 600 characters)...'
                    : 'Write your story or reflection in Markdown...'
                }
                className={`w-full p-4 bg-paper border border-ink text-ink text-base leading-relaxed rounded-none focus:outline-2 focus:outline-moss ${
                  kind === 'poem' ? 'font-serif' : 'font-sans'
                }`}
              />
            </div>
          )}

          {/* Footer Stats & Formatting Guide Drawer */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-2 text-xs text-muted">
            <div className="flex items-center space-x-3">
              <span>{bodyMd.trim().split(/\s+/).filter(Boolean).length} words</span>
              {kind === 'poem' ? (
                <>
                  <span>&middot;</span>
                  <span>{bodyMd.split('\n').filter(Boolean).length} lines</span>
                  <span>&middot;</span>
                  <span>{bodyMd.trim().split(/\n{2,}/).filter(Boolean).length} stanzas</span>
                </>
              ) : (
                <>
                  <span>&middot;</span>
                  <span>~{Math.ceil(bodyMd.trim().split(/\s+/).filter(Boolean).length / 200)} min read</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-1 text-moss hover:text-ink underline cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{showGuide ? 'Hide formatting guide' : 'Formatting guide'}</span>
            </button>
          </div>

          {/* Formatting Cheat Sheet Accordion */}
          {showGuide && (
            <div className="mt-4 p-4 bg-paper-deep border border-line text-xs space-y-3">
              <h3 className="font-semibold text-ink uppercase tracking-wider text-[11px]">
                Writing & Formatting Guide
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-muted">
                <div>
                  <p className="font-medium text-ink mb-1">Emphasis</p>
                  <p><code className="bg-paper px-1">*italic*</code> &rarr; <em>italic</em></p>
                  <p><code className="bg-paper px-1">**bold**</code> &rarr; <strong>bold</strong></p>
                  <p><code className="bg-paper px-1">~strike~</code> &rarr; <s>strike</s></p>
                </div>
                <div>
                  <p className="font-medium text-ink mb-1">Poetry & Spacing</p>
                  <p>Line break &rarr; Press <kbd className="bg-paper px-1">Enter</kbd></p>
                  <p>New stanza &rarr; Press <kbd className="bg-paper px-1">Enter</kbd> twice</p>
                  <p>Indent line &rarr; 4 spaces or <kbd className="bg-paper px-1">Tab</kbd></p>
                </div>
                <div>
                  <p className="font-medium text-ink mb-1">Structure & Links</p>
                  <p><code className="bg-paper px-1">## Heading</code> &rarr; Section title</p>
                  <p><code className="bg-paper px-1">&gt; Quote</code> &rarr; Pull quote</p>
                  <p><code className="bg-paper px-1">[Title](url)</code> &rarr; Link</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Attribution (Quote only) */}
        {kind === 'quote' && (
          <div>
            <label htmlFor="post-attr" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
              Attribution (Leave blank if your own quote)
            </label>
            <input
              type="text"
              id="post-attr"
              value={attribution}
              onChange={(e) => setAttribution(e.target.value)}
              placeholder="e.g. Maya Angelou (or leave empty)"
              className="w-full px-3 py-2 bg-paper border border-ink text-ink text-sm rounded-none"
            />
          </div>
        )}

        {/* Excerpt (Poems, Stories & Reflections) */}
        {(kind === 'poem' || kind === 'story' || kind === 'reflection') && (
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <label htmlFor="post-excerpt" className="block text-xs uppercase tracking-wider text-muted font-medium">
                  {kind === 'poem'
                    ? 'Strongest Line(s) / Featured Verse'
                    : 'Short Summary / Excerpt'}
                </label>
                <span className="text-[10px] font-mono lowercase">
                  {isCustomExcerpt ? (
                    <span className="text-muted border border-line px-1.5 py-0.5">Custom</span>
                  ) : (
                    <span className="text-moss bg-sage-soft border border-moss/40 px-1.5 py-0.5 font-medium">
                      Auto-generated
                    </span>
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const auto = generateExcerpt(bodyMd, kind);
                  setExcerpt(auto);
                  setIsCustomExcerpt(false);
                }}
                className="text-xs text-moss hover:text-ink hover:underline cursor-pointer"
                title="Regenerate excerpt from content"
              >
                ↻ Re-generate from text
              </button>
            </div>

            <textarea
              id="post-excerpt"
              rows={2}
              value={excerpt}
              onChange={(e) => {
                setExcerpt(e.target.value);
                setIsCustomExcerpt(true);
              }}
              placeholder={
                kind === 'poem'
                  ? 'Auto-generated from first verse lines, or customize here...'
                  : 'Auto-generated summary from text, or customize here...'
              }
              className="w-full px-3 py-2 bg-paper border border-line text-sm text-ink rounded-none focus:outline-2 focus:outline-moss"
            />
          </div>
        )}

        {/* Featured Artwork / Image (Poems, Stories & Reflections) */}
        {kind !== 'quote' && (
          <div className="p-5 bg-paper-deep border border-line space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted font-medium">
                  Featured Artwork / Illustration
                </label>
                <p className="text-xs text-muted mt-0.5">
                  {kind === 'poem'
                    ? 'Upload a delicate artwork vignette or illustration displayed above the poem verses.'
                    : 'Upload an editorial cover image or painting displayed at the top of this piece.'}
                </p>
              </div>
              {featuredImagePath && (
                <button
                  type="button"
                  onClick={() => {
                    setFeaturedImagePath('');
                    setFeaturedImageAlt('');
                    setFeaturedImageCaption('');
                  }}
                  className="text-xs text-alert hover:underline cursor-pointer"
                >
                  Remove artwork
                </button>
              )}
            </div>

            {featuredImagePath ? (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-paper p-3 border border-line">
                  <div className="w-36 h-24 sm:w-44 sm:h-28 shrink-0 overflow-hidden border border-ink/30 bg-paper-deep relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featuredImagePath}
                      alt={featuredImageAlt || 'Featured preview'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2 text-xs">
                    <p className="text-ink font-medium truncate max-w-md">
                      {featuredImagePath.split('/').pop()}
                    </p>
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="post-image-replace"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper border border-line text-ink hover:bg-paper-deep cursor-pointer font-medium"
                      >
                        <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Replace file</span>
                        <input
                          id="post-image-replace"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="sr-only"
                        />
                      </label>
                      {uploadingImage && (
                        <span className="flex items-center gap-1 text-muted">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Alt text field (Required for a11y) */}
                <div>
                  <label
                    htmlFor="post-featured-image-alt"
                    className="block text-xs uppercase tracking-wider text-muted font-medium mb-1"
                  >
                    Image Description / Alt Text <span className="text-alert">*</span>
                    <span className="text-[10px] text-muted normal-case ml-2 font-normal">
                      (Required for accessibility &amp; screen readers)
                    </span>
                  </label>
                  <input
                    type="text"
                    id="post-featured-image-alt"
                    value={featuredImageAlt}
                    onChange={(e) => setFeaturedImageAlt(e.target.value)}
                    placeholder="e.g. Painting of rain falling against a window in dim twilight"
                    className="w-full px-3 py-2 bg-paper border border-ink text-ink text-sm rounded-none focus:outline-2 focus:outline-moss"
                    required
                  />
                </div>

                {/* Caption / Credit field (Optional) */}
                <div>
                  <label
                    htmlFor="post-featured-image-caption"
                    className="block text-xs uppercase tracking-wider text-muted font-medium mb-1"
                  >
                    Caption or Artist Credit <span className="text-[10px] text-muted normal-case ml-2 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="post-featured-image-caption"
                    value={featuredImageCaption}
                    onChange={(e) => setFeaturedImageCaption(e.target.value)}
                    placeholder="e.g. Oil on linen, 2024 / Photograph courtesy of..."
                    className="w-full px-3 py-2 bg-paper border border-line text-ink text-sm rounded-none focus:outline-2 focus:outline-moss"
                  />
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-line p-6 text-center bg-paper hover:bg-paper-deep/50 transition-colors">
                <label
                  htmlFor="post-image-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="p-2.5 bg-paper-deep rounded-full border border-line text-muted">
                    {uploadingImage ? (
                      <Loader2 className="w-5 h-5 animate-spin text-moss" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted" aria-hidden="true" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-ink">
                    {uploadingImage ? 'Uploading image to media library…' : 'Click to select artwork or featured image'}
                  </span>
                  <span className="text-[11px] text-muted">
                    PNG, JPEG, WebP, AVIF or GIF &middot; Max 10 MB
                  </span>
                  <input
                    id="post-image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="sr-only"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {/* Reader Comments Setting */}
        <div className="p-4 bg-paper-deep border border-line flex items-start justify-between gap-4">
          <div>
            <label htmlFor="post-allow-comments" className="text-sm font-medium text-ink block cursor-pointer">
              Allow reader comments on this piece
            </label>
            <p className="text-xs text-muted mt-0.5">
              When enabled, readers can leave reflections and comments below this piece. You can moderate or close comments at any time.
            </p>
          </div>
          <input
            type="checkbox"
            id="post-allow-comments"
            checked={allowComments}
            onChange={(e) => setAllowComments(e.target.checked)}
            className="h-4 w-4 mt-1 accent-moss cursor-pointer"
          />
        </div>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-paper-deep border-t border-ink/40 p-4 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {status === 'published' ? (
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={isPending}
              className="px-6 py-3 border border-line bg-paper text-muted hover:text-ink text-sm font-medium cursor-pointer"
            >
              Unpublish to Draft
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="px-6 py-3 border border-ink bg-paper hover:bg-paper-deep text-ink text-sm font-medium transition-colors cursor-pointer"
            >
              {isPending ? 'Saving…' : 'Save Draft'}
            </button>
          )}

          <div className="flex items-center space-x-3">
            {status === 'published' ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="px-8 py-3 bg-sage hover:bg-sage/80 border border-ink text-ink font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPending ? 'Saving…' : 'Save Changes'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPublishDialogOpen(true)}
                disabled={isPending || !id}
                className="px-8 py-3 bg-sage hover:bg-sage/80 border border-ink text-ink font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                Publish…
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Publish Confirmation Modal Dialog */}
      {publishDialogOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-post-title"
            className="bg-paper border border-ink p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-md"
          >
            <h2 id="publish-post-title" className="font-serif text-2xl text-ink font-normal">
              Publish &ldquo;{title || 'Untitled'}&rdquo;?
            </h2>

            <p className="text-sm text-muted leading-relaxed">
              This piece will immediately become publicly readable at{' '}
              <code className="font-mono text-xs bg-paper-deep px-1">
                {getPiecePath(kind, slug)}
              </code>.

            </p>

            {/* Email notification switch */}
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

            {/* Reader comments switch in publish modal */}
            <div className="p-4 bg-paper-deep border border-line space-y-2">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(e) => setAllowComments(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-moss"
                />
                <div>
                  <span className="text-sm font-medium text-ink block">
                    Allow reader comments on this piece
                  </span>
                  <span className="text-xs text-muted block">
                    Readers can post reflections under the published piece.
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
