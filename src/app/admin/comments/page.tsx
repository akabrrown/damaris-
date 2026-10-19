import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminComments } from '@/lib/queries';
import { getPiecePath } from '@/lib/routing';
import { AdminCommentRowActions } from '@/components/admin-comment-row-actions';
import { AdminPostCommentToggle } from '@/components/admin-post-comment-toggle';
import { MessageSquare, ExternalLink, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Comments Moderation | Admin',
};

export const dynamic = 'force-dynamic';

export default async function AdminCommentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/admin/login');

  const [comments, { data: posts }] = await Promise.all([
    getAdminComments(100),
    supabase
      .from('posts')
      .select('id, kind, slug, title, status, allow_comments, published_at')
      .order('created_at', { ascending: false }),
  ]);

  const approvedCount = comments.filter((c) => c.status === 'approved').length;
  const piecesWithComments = (posts || []).filter((p) => p.allow_comments).length;

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted mb-2">
          <MessageSquare className="w-4 h-4 text-moss" aria-hidden="true" />
          <span>Community &amp; Feedback</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink font-normal tracking-tight">
          Reader Comments &amp; Moderation
        </h1>
        <p className="text-sm text-muted mt-2">
          Manage reader reflections and control comment permissions across all uploaded pieces.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-paper border border-line">
          <span className="text-xs uppercase tracking-wider text-muted font-mono block mb-1">
            Total Comments
          </span>
          <span className="font-serif text-3xl text-ink font-normal">{comments.length}</span>
          <span className="text-xs text-muted block mt-1">Across all publications</span>
        </div>

        <div className="p-5 bg-paper border border-line">
          <span className="text-xs uppercase tracking-wider text-muted font-mono block mb-1">
            Approved Comments
          </span>
          <span className="font-serif text-3xl text-moss font-normal flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-moss inline" aria-hidden="true" />
            <span>{approvedCount}</span>
          </span>
          <span className="text-xs text-muted block mt-1">Live on piece pages</span>
        </div>

        <div className="p-5 bg-paper border border-line">
          <span className="text-xs uppercase tracking-wider text-muted font-mono block mb-1">
            Pieces With Comments Open
          </span>
          <span className="font-serif text-3xl text-ink font-normal">
            {piecesWithComments} / {(posts || []).length}
          </span>
          <span className="text-xs text-muted block mt-1">Can receive reader thoughts</span>
        </div>
      </div>

      {/* Section 1: Recent Comments */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal flex items-center gap-2">
            <span>Recent Comments</span>
            <span className="text-xs font-sans text-muted font-mono">({comments.length})</span>
          </h2>
        </div>

        {comments.length > 0 ? (
          <div className="bg-paper border border-line divide-y divide-line/60">
            {comments.map((comment) => {
              const dateStr = comment.created_at
                ? new Date(comment.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';

              const pieceUrl =
                comment.post_kind && comment.post_slug
                  ? getPiecePath(comment.post_kind, comment.post_slug)
                  : null;

              return (
                <div key={comment.id} className="p-5 sm:p-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-base font-medium text-ink">
                        {comment.author_name}
                      </span>
                      {comment.author_email && (
                        <span className="text-xs text-muted font-mono">
                          &lt;{comment.author_email}&gt;
                        </span>
                      )}
                      <span
                        className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 border ${
                          comment.status === 'approved'
                            ? 'bg-sage-soft border-moss/40 text-moss'
                            : comment.status === 'spam'
                            ? 'bg-alert/10 border-alert/40 text-alert'
                            : 'bg-paper-deep border-line text-muted'
                        }`}
                      >
                        {comment.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <time dateTime={comment.created_at} className="text-xs text-muted">
                        {dateStr}
                      </time>
                      <AdminCommentRowActions
                        commentId={comment.id}
                        currentStatus={comment.status}
                      />
                    </div>
                  </div>

                  {/* Comment text */}
                  <p className="text-sm text-ink/90 leading-relaxed font-sans bg-paper-deep p-3 border border-line/40 whitespace-pre-line">
                    {comment.content}
                  </p>

                  {/* Post title reference */}
                  <div className="flex items-center justify-between text-xs text-muted pt-1">
                    <div>
                      <span>On piece: </span>
                      <strong className="text-ink font-medium">
                        {comment.post_title || 'Untitled'}
                      </strong>
                      {comment.post_kind && (
                        <span className="uppercase text-[10px] text-muted/70 ml-2">
                          ({comment.post_kind})
                        </span>
                      )}
                    </div>

                    {pieceUrl && (
                      <Link
                        href={pieceUrl}
                        target="_blank"
                        className="text-moss hover:text-ink underline inline-flex items-center gap-1"
                      >
                        <span>View live piece</span>
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center border border-line bg-paper">
            <p className="font-serif italic text-muted">
              No comments have been posted yet.
            </p>
          </div>
        )}
      </section>

      {/* Section 2: Quick Toggle for Piece Comment Permissions */}
      <section className="space-y-4 pt-4">
        <div className="border-b border-line pb-3">
          <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal">
            Piece Comment Permissions
          </h2>
          <p className="text-xs text-muted mt-1">
            Quickly allow or disallow user comments on any piece without opening the full editor.
          </p>
        </div>

        <div className="bg-paper border border-line overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-deep border-b border-line text-xs uppercase tracking-wider text-muted font-mono">
              <tr>
                <th className="p-4">Piece Title</th>
                <th className="p-4">Kind</th>
                <th className="p-4">Status</th>
                <th className="p-4">Comments Permission</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {(posts || []).map((post) => (
                <tr key={post.id} className="hover:bg-paper-deep/50 transition-colors">
                  <td className="p-4 font-serif text-ink font-medium">
                    {post.title || (post.kind === 'quote' ? `Quote: "${post.slug}"` : 'Untitled')}
                  </td>
                  <td className="p-4 text-xs uppercase tracking-wider text-muted">
                    {post.kind}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 border ${
                        post.status === 'published'
                          ? 'bg-sage-soft border-moss/40 text-moss'
                          : 'bg-paper-deep border-line text-muted'
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <AdminPostCommentToggle
                      postId={post.id}
                      allowComments={post.allow_comments ?? true}
                    />
                  </td>
                  <td className="p-4 text-right space-x-3 text-xs">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="text-moss hover:text-ink underline"
                    >
                      Edit piece
                    </Link>
                    {post.status === 'published' && (
                      <Link
                        href={getPiecePath(post.kind, post.slug)}
                        target="_blank"
                        className="text-muted hover:text-ink underline inline-flex items-center gap-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
