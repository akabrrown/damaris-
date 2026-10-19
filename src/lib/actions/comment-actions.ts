'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createPublicClient } from '@/lib/supabase/server';
import { commentInputSchema, CommentInput } from '@/lib/schemas';
import { recordAuditLog } from '@/lib/audit';
import { getPiecePath } from '@/lib/routing';
import { CommentStatus } from '@/lib/types';

/**
 * Asserts that the currently signed-in user is an authorized admin.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('UNAUTHENTICATED');
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
  if (adminError || !isAdmin) {
    throw new Error('FORBIDDEN: You do not have admin permissions.');
  }

  return { supabase, user };
}

/**
 * Public action: Submit a reader reflection / comment on a piece.
 */
export async function submitCommentAction(input: CommentInput) {
  const validated = commentInputSchema.parse(input);

  // Honeypot check: If website field is filled by bot, silently return success
  if (validated.website && validated.website.trim().length > 0) {
    return { success: true, message: 'Thank you for your comment.' };
  }

  const supabase = createPublicClient();

  // Verify post is published and comments are enabled
  const { data: post, error: postErr } = await supabase
    .from('posts')
    .select('id, kind, slug, status, allow_comments, title')
    .eq('id', validated.postId)
    .single();

  if (postErr || !post || post.status !== 'published') {
    throw new Error('Piece not found or unpublished.');
  }

  if (post.allow_comments === false) {
    throw new Error('Comments are closed for this piece.');
  }

  const { data: comment, error: insertErr } = await supabase
    .from('post_comments')
    .insert({
      post_id: post.id,
      author_name: validated.authorName,
      author_email: validated.authorEmail || null,
      content: validated.content,
      status: 'approved',
    })
    .select('id, post_id, author_name, content, status, created_at, updated_at')
    .single();

  if (insertErr || !comment) {
    throw new Error(`Failed to save comment: ${insertErr?.message || 'Database error'}`);
  }

  // Revalidate the piece detail page so the comment appears immediately
  revalidatePath(getPiecePath(post.kind, post.slug));

  return {
    success: true,
    message: 'Your comment has been posted.',
    comment,
  };
}

/**
 * Admin action: Moderate comment status (approved, spam, deleted).
 */
export async function moderateCommentAction(commentId: string, status: CommentStatus) {
  const { supabase } = await requireAdmin();

  const { data: comment, error: fetchErr } = await supabase
    .from('post_comments')
    .select('id, post_id, posts (kind, slug, title)')
    .eq('id', commentId)
    .single();

  if (fetchErr || !comment) {
    throw new Error('Comment not found');
  }

  const { error: updateErr } = await supabase
    .from('post_comments')
    .update({ status })
    .eq('id', commentId);

  if (updateErr) {
    throw new Error(`Failed to update comment status: ${updateErr.message}`);
  }

  const post = Array.isArray(comment.posts) ? comment.posts[0] : comment.posts;
  if (post?.kind && post?.slug) {
    revalidatePath(getPiecePath(post.kind, post.slug));
  }
  revalidatePath('/admin/comments');

  await recordAuditLog({
    action: 'comment.moderated',
    resource_type: 'post',
    resource_id: commentId,
    description: `Moderated comment status to "${status}"`,
    metadata: { commentId, newStatus: status, postId: comment.post_id },
  });

  return { success: true };
}

/**
 * Admin action: Permanently delete a comment.
 */
export async function deleteCommentAction(commentId: string) {
  const { supabase } = await requireAdmin();

  const { data: comment, error: fetchErr } = await supabase
    .from('post_comments')
    .select('id, post_id, posts (kind, slug)')
    .eq('id', commentId)
    .single();

  if (fetchErr || !comment) {
    throw new Error('Comment not found');
  }

  const { error: deleteErr } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId);

  if (deleteErr) {
    throw new Error(`Failed to delete comment: ${deleteErr.message}`);
  }

  const post = Array.isArray(comment.posts) ? comment.posts[0] : comment.posts;
  if (post?.kind && post?.slug) {
    revalidatePath(getPiecePath(post.kind, post.slug));
  }
  revalidatePath('/admin/comments');

  await recordAuditLog({
    action: 'comment.deleted',
    resource_type: 'post',
    resource_id: commentId,
    description: 'Permanently deleted comment',
    metadata: { commentId, postId: comment.post_id },
  });

  return { success: true };
}

/**
 * Admin action: Toggle whether comments are allowed on a post.
 */
export async function togglePostCommentsAction(postId: string, allowComments: boolean) {
  const { supabase } = await requireAdmin();

  const { data: post, error: fetchErr } = await supabase
    .from('posts')
    .select('id, kind, slug, title, allow_comments')
    .eq('id', postId)
    .single();

  if (fetchErr || !post) {
    throw new Error('Post not found');
  }

  const { error: updateErr } = await supabase
    .from('posts')
    .update({ allow_comments: allowComments })
    .eq('id', postId);

  if (updateErr) {
    throw new Error(`Failed to update post comments setting: ${updateErr.message}`);
  }

  revalidatePath(getPiecePath(post.kind, post.slug));
  revalidatePath('/admin/posts');
  revalidatePath(`/admin/posts/${postId}/edit`);

  await recordAuditLog({
    action: 'post.comments_toggled',
    resource_type: 'post',
    resource_id: postId,
    description: `${allowComments ? 'Enabled' : 'Disabled'} comments for "${post.title || post.slug}"`,
    metadata: { postId, allowComments },
  });

  return { success: true, allowComments };
}
