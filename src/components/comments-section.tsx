'use client';

import React, { useState, useTransition } from 'react';
import { PostComment } from '@/lib/types';
import { submitCommentAction } from '@/lib/actions/comment-actions';
import { MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface CommentsSectionProps {
  postId: string;
  allowComments: boolean;
  initialComments: PostComment[];
}

export function CommentsSection({
  postId,
  allowComments,
  initialComments,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<PostComment[]>(initialComments);
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [content, setContent] = useState('');
  const [websiteHoneypot, setWebsiteHoneypot] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!authorName.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }

    if (!content.trim()) {
      setErrorMessage('Please enter your comment or reflection.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await submitCommentAction({
          postId,
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim() || undefined,
          content: content.trim(),
          website: websiteHoneypot,
        });

        if (res.comment) {
          setComments((prev) => [...prev, res.comment as PostComment]);
        }

        setSuccessMessage('Thank you. Your comment has been shared.');
        setContent('');
      } catch (err: unknown) {
        setErrorMessage((err as Error).message || 'Failed to submit comment. Please try again.');
      }
    });
  };

  return (
    <section
      aria-labelledby="comments-heading"
      className="mt-14 pt-10 border-t border-line/70 max-w-[62ch] mx-auto text-left"
    >
      <div className="flex items-center justify-between mb-8">
        <h2
          id="comments-heading"
          className="font-serif text-2xl text-ink font-normal flex items-center gap-2"
        >
          <MessageSquare className="w-5 h-5 text-moss" aria-hidden="true" />
          <span>Reflections &amp; Comments</span>
          <span className="text-sm font-sans text-muted font-normal ml-1">
            ({comments.length})
          </span>
        </h2>
      </div>

      {/* List of comments */}
      {comments.length > 0 ? (
        <div className="space-y-6 divide-y divide-line/40 mb-10">
          {comments.map((comment) => {
            const dateStr = comment.created_at
              ? new Date(comment.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '';

            return (
              <div key={comment.id} className="pt-6 first:pt-0">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-serif text-base font-medium text-ink">
                    {comment.author_name}
                  </span>
                  <time
                    dateTime={comment.created_at}
                    className="text-xs text-muted/70"
                  >
                    {dateStr}
                  </time>
                </div>
                <div className="text-ink/90 text-sm sm:text-base leading-relaxed whitespace-pre-line font-sans">
                  {comment.content}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm font-serif italic text-muted py-4 mb-8">
          {allowComments
            ? 'No comments yet. Leave the first thought below.'
            : 'Comments are closed for this piece.'}
        </p>
      )}

      {/* Comment submission form */}
      {allowComments ? (
        <form
          onSubmit={handleSubmit}
          className="p-6 bg-paper-deep border border-line space-y-4"
          aria-label="Leave a reflection"
        >
          <h3 className="font-serif text-lg text-ink font-normal">
            Leave a thought
          </h3>

          {/* Messages */}
          {successMessage && (
            <div
              role="status"
              className="p-3 bg-sage-soft border border-moss/30 text-moss text-xs sm:text-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-alert/10 border border-alert/30 text-alert text-xs sm:text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="comment-author-name"
                className="block text-xs uppercase tracking-wider text-muted font-medium mb-1"
              >
                Your Name <span className="text-alert">*</span>
              </label>
              <input
                type="text"
                id="comment-author-name"
                required
                maxLength={80}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Ama or Kwesi"
                className="w-full px-3 py-2 bg-paper border border-ink text-ink text-sm rounded-none focus:outline-2 focus:outline-moss"
              />
            </div>

            <div>
              <label
                htmlFor="comment-author-email"
                className="block text-xs uppercase tracking-wider text-muted font-medium mb-1"
              >
                Email <span className="text-muted/60 lowercase">(optional, not shown)</span>
              </label>
              <input
                type="email"
                id="comment-author-email"
                maxLength={254}
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder="reader@example.com"
                className="w-full px-3 py-2 bg-paper border border-line text-ink text-sm rounded-none focus:outline-2 focus:outline-moss"
              />
            </div>
          </div>

          {/* Antispam honeypot field - invisible to human users */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="comment-website-hp">Leave this empty</label>
            <input
              type="text"
              id="comment-website-hp"
              tabIndex={-1}
              autoComplete="off"
              value={websiteHoneypot}
              onChange={(e) => setWebsiteHoneypot(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="comment-content"
                className="block text-xs uppercase tracking-wider text-muted font-medium"
              >
                Your Comment <span className="text-alert">*</span>
              </label>
              <span className="text-xs text-muted">
                {content.length} / 2000
              </span>
            </div>
            <textarea
              id="comment-content"
              required
              rows={4}
              maxLength={2000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what this piece evoked or meant to you..."
              className="w-full p-3 bg-paper border border-ink text-ink text-sm rounded-none focus:outline-2 focus:outline-moss leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-muted">
              Kind and respectful thoughts are always welcomed.
            </p>
            <button
              type="submit"
              disabled={isPending || !content.trim() || !authorName.trim()}
              className="px-5 py-2.5 bg-sage hover:bg-sage/80 border border-ink text-ink font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isPending ? 'Posting…' : 'Post Reflection'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-paper-deep border border-line/60 text-xs text-muted uppercase tracking-wider text-center">
          Comments are closed for this piece
        </div>
      )}
    </section>
  );
}
