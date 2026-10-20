import { createPublicClient } from './supabase/server';
import { Post, Book, SiteSettings, PostComment } from './types';
import { PostKind } from './schemas';
import { decodeCursor, encodeCursor } from './cursor';

/**
 * Loads the singleton site_settings row.
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('id, site_title, tagline, author_name, about_md, about_photo_path, about_photo_alt, contact_email, social_links, updated_at')
      .eq('id', 1)
      .single();

    if (error || !data) return null;
    return data as unknown as SiteSettings;
  } catch (err) {
    console.error('[Queries] Failed to load site_settings:', err);
    return null;
  }
}

/**
 * Loads the 6 most recent published items across all kinds for the Home page (FR-HOME-01).
 */
export async function getRecentPosts(limit = 6): Promise<Post[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('posts')
      .select('id, kind, slug, title, body_md, excerpt, attribution, allow_comments, featured_image_path, featured_image_alt, featured_image_caption, status, published_at, created_at, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as unknown as Post[];
  } catch (err) {
    console.error('[Queries] Failed to load recent posts:', err);
    return [];
  }
}

export interface PaginatedPostsResult {
  items: Post[];
  nextCursor: string | null;
}

/**
 * Loads a page of posts for a specific section using keyset pagination (FR-LIST-01).
 * Page size is 12 (or 20 for quotes).
 */
export async function getPostsByKind(
  kind: PostKind,
  cursorString?: string,
  limit?: number
): Promise<PaginatedPostsResult> {
  try {
    const supabase = createPublicClient();
    const pageSize = limit || (kind === 'quote' ? 20 : 12);

    let query = supabase
      .from('posts')
      .select('id, kind, slug, title, body_md, excerpt, attribution, allow_comments, featured_image_path, featured_image_alt, featured_image_caption, status, published_at, created_at, updated_at')
      .eq('status', 'published')
      .eq('kind', kind)
      .order('published_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(pageSize + 1);

    if (cursorString) {
      const cursor = decodeCursor(cursorString);
      if (cursor) {
        // Keyset comparison: (published_at < cursor.publishedAt) OR (published_at = cursor.publishedAt AND id < cursor.id)
        query = query.or(
          `published_at.lt.${cursor.publishedAt},and(published_at.eq.${cursor.publishedAt},id.lt.${cursor.id})`
        );
      }
    }

    const { data, error } = await query;
    if (error || !data) return { items: [], nextCursor: null };

    const hasMore = data.length > pageSize;
    const items = (hasMore ? data.slice(0, pageSize) : data) as unknown as Post[];

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const last = items[items.length - 1];
      if (last.published_at) {
        nextCursor = encodeCursor(last.published_at, last.id);
      }
    }

    return { items, nextCursor };
  } catch (err) {
    console.error(`[Queries] Failed to load posts for ${kind}:`, err);
    return { items: [], nextCursor: null };
  }
}

/**
 * Loads a single piece by kind and slug (FR-READ-01).
 */
export async function getPostBySlug(kind: PostKind, slug: string): Promise<Post | null> {
  try {
    const supabase = createPublicClient();
    const normalizedSlug = decodeURIComponent(slug).trim().toLowerCase();
    const { data, error } = await supabase
      .from('posts')
      .select('id, kind, slug, title, body_md, excerpt, attribution, allow_comments, featured_image_path, featured_image_alt, featured_image_caption, status, published_at, created_at, updated_at')
      .eq('status', 'published')
      .eq('kind', kind)
      .eq('slug', normalizedSlug)
      .maybeSingle();

    if (error) {
      console.error(`[Queries] Supabase error in getPostBySlug (${kind}/${slug}):`, error);
      return null;
    }
    if (!data) return null;
    return data as unknown as Post;
  } catch (err) {
    console.error(`[Queries] Failed to load post ${kind}/${slug}:`, err);
    return null;
  }
}

/**
 * Loads adjacent published posts (previous and next) within the same section.
 */
export async function getAdjacentPosts(kind: PostKind, currentPost: Post) {
  try {
    const supabase = createPublicClient();
    if (!currentPost.published_at) return { prev: null, next: null };

    // Prev (older)
    const { data: prevData } = await supabase
      .from('posts')
      .select('id, kind, slug, title')
      .eq('status', 'published')
      .eq('kind', kind)
      .or(
        `published_at.lt.${currentPost.published_at},and(published_at.eq.${currentPost.published_at},id.lt.${currentPost.id})`
      )
      .order('published_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Next (newer)
    const { data: nextData } = await supabase
      .from('posts')
      .select('id, kind, slug, title')
      .eq('status', 'published')
      .eq('kind', kind)
      .or(
        `published_at.gt.${currentPost.published_at},and(published_at.eq.${currentPost.published_at},id.gt.${currentPost.id})`
      )
      .order('published_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    return {
      prev: prevData || null,
      next: nextData || null,
    };
  } catch (err) {
    console.error(`[Queries] Failed to load adjacent posts for ${currentPost.id}:`, err);
    return { prev: null, next: null };
  }
}

/**
 * Loads published books ordered by sort_order and publication date (FR-BOOK-01).
 */
export async function getPublishedBooks(): Promise<Book[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('books')
      .select('id, slug, title, subtitle, synopsis_md, excerpt_md, cover_path, cover_alt, progress, purchase_url, release_date, sort_order, status, published_at, created_at, updated_at')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false });

    if (error || !data) return [];
    return data as unknown as Book[];
  } catch (err) {
    console.error('[Queries] Failed to load published books:', err);
    return [];
  }
}

/**
 * Loads a single book by slug.
 */
export async function getBookBySlug(slug: string): Promise<Book | null> {
  try {
    const supabase = createPublicClient();
    const normalizedSlug = decodeURIComponent(slug).trim().toLowerCase();
    const { data, error } = await supabase
      .from('books')
      .select('id, slug, title, subtitle, synopsis_md, excerpt_md, cover_path, cover_alt, progress, purchase_url, release_date, sort_order, status, published_at, created_at, updated_at')
      .eq('status', 'published')
      .eq('slug', normalizedSlug)
      .maybeSingle();

    if (error || !data) return null;
    return data as unknown as Book;
  } catch (err) {
    console.error(`[Queries] Failed to load book ${slug}:`, err);
    return null;
  }
}

/**
 * Loads approved comments for a specific post, ordered chronologically.
 */
export async function getPostComments(postId: string): Promise<PostComment[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('post_comments')
      .select('id, post_id, author_name, author_email, content, status, created_at, updated_at')
      .eq('post_id', postId)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data as unknown as PostComment[];
  } catch (err) {
    console.error(`[Queries] Failed to load comments for post ${postId}:`, err);
    return [];
  }
}

export interface AdminCommentRow extends PostComment {
  post_title: string | null;
  post_slug: string | null;
  post_kind: PostKind | null;
}

interface RawCommentQueryItem {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string | null;
  content: string;
  status: PostComment['status'];
  created_at: string;
  updated_at: string;
  posts:
    | {
        title: string | null;
        slug: string | null;
        kind: PostKind | null;
      }
    | {
        title: string | null;
        slug: string | null;
        kind: PostKind | null;
      }[]
    | null;
}

/**
 * Loads all comments across pieces for admin moderation.
 */
export async function getAdminComments(limit = 100): Promise<AdminCommentRow[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        id,
        post_id,
        author_name,
        author_email,
        content,
        status,
        created_at,
        updated_at,
        posts:post_id (
          title,
          slug,
          kind
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    const items = data as unknown as RawCommentQueryItem[];
    return items.map((item) => {
      const post = Array.isArray(item.posts) ? item.posts[0] : item.posts;
      return {
        id: item.id,
        post_id: item.post_id,
        author_name: item.author_name,
        author_email: item.author_email,
        content: item.content,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        post_title: post?.title || null,
        post_slug: post?.slug || null,
        post_kind: post?.kind || null,
      };
    });
  } catch (err) {
    console.error('[Queries] Failed to load admin comments:', err);
    return [];
  }
}



