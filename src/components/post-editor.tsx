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
} from '@/lib/actions/admin-actions';
import { generateSlug } from '@/lib/slug';
import {
  MarkdownToolbar,
  wrapSelectionInTextarea,
  prefixLinesInTextarea,
  outdentLinesInTextarea,
} from '@/components/markdown-toolbar';
import { renderVerse, renderVerseLineHtml, sanitizeMarkdown } from '@/lib/content-renderer';
import { Edit3, Eye, Columns2, HelpCircle } from 'lucide-react';

interface PostEditorProps {
  initialPost?: {
    id: string;
    kind: PostKind;
    title: string | null;
    slug: string;
    body_md: string;
    excerpt: string | null;
    attribution: string | null;
    status: PublishStatus;
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
  const [attribution, setAttribution] = useState(initialPost?.attribution || '');
  const [status, setStatus] = useState<PublishStatus>(initialPost?.status || 'draft');

  // Autosave status state
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [errorMessage, setErrorMessage] = useState('');
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
        <div
          className="prose-reading leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeMarkdown(bodyMd) }}
        />
      </article>
    );
  };

  const handleAutoSave = React.useCallback(async () => {
    if (!id || !bodyMd.trim()) return;
    setSaveState('saving');
    try {
      await updatePostAction(id, {
        title: title || undefined,
        body_md: bodyMd,
        excerpt: excerpt || undefined,
        attribution: attribution || undefined,
        slug: slug || undefined,
      });
      setSaveState('saved');
    } catch {
      setSaveState('unsaved');
    }
  }, [id, title, bodyMd, excerpt, attribution, slug]);

  // Autosave timer
  useEffect(() => {
    if (!id || status === 'published') return;

    setSaveState('unsaved');
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 4000);

    return () => clearTimeout(timer);
  }, [id, status, handleAutoSave]);

  const handleSaveDraft = async () => {
    setErrorMessage('');
    startTransition(async () => {
      try {
        if (!id) {
          const created = await createPostAction({
            kind,
            title: title || undefined,
            body_md: bodyMd || ' ',
            excerpt: excerpt || undefined,
            attribution: attribution || undefined,
            slug: slug || generateSlug(title || 'item'),
            status: 'draft',
            notify: false,
          });
          setId(created.id);
          router.replace(`/admin/posts/${created.id}`);
        } else {
          await updatePostAction(id, {
            title: title || undefined,
            body_md: bodyMd,
            excerpt: excerpt || undefined,
            attribution: attribution || undefined,
            slug: slug || undefined,
          });
        }
        setSaveState('saved');
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
          {id && (
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
                  onChange={setBodyMd}
                  kind={kind}
                />
                <textarea
                  ref={textareaRef}
                  id="post-body"
                  rows={kind === 'quote' ? 8 : 20}
                  value={bodyMd}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setBodyMd(e.target.value)}
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
                onChange={setBodyMd}
                kind={kind}
              />
              <textarea
                ref={textareaRef}
                id="post-body"
                rows={kind === 'quote' ? 6 : 18}
                value={bodyMd}
                onKeyDown={handleKeyDown}
                onChange={(e) => setBodyMd(e.target.value)}
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
            <label htmlFor="post-excerpt" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1">
              {kind === 'poem'
                ? 'Strongest Line(s) / Featured Verse (Optional — defaults to opening lines)'
                : 'Short Summary / Excerpt (Optional)'}
            </label>
            <textarea
              id="post-excerpt"
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder={
                kind === 'poem'
                  ? 'e.g. The 1 or 2 strongest lines to display as the tap hook on your site...'
                  : 'Brief summary to display in list views...'
              }
              className="w-full px-3 py-2 bg-paper border border-line text-sm text-ink rounded-none"
            />
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-paper-deep border-t border-ink/40 p-4 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isPending}
            className="px-6 py-3 border border-ink bg-paper hover:bg-paper-deep text-ink text-sm font-medium transition-colors cursor-pointer"
          >
            {isPending ? 'Saving…' : 'Save Draft'}
          </button>

          <div className="flex items-center space-x-3">
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
                /{kind === 'story' ? 'stories' : kind === 'reflection' ? 'reflections' : kind}/{slug}
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
