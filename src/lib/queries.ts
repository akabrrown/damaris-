import { createClient } from './supabase/server';
import { Post, Book, SiteSettings } from './types';
import { PostKind } from './schemas';
import { decodeCursor, encodeCursor } from './cursor';

/**
 * Loads the singleton site_settings row.
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('site_settings')
    .select('id, site_title, tagline, author_name, about_md, about_photo_path, about_photo_alt, contact_email, social_links, updated_at')
    .eq('id', 1)
    .single();

  if (error || !data) return null;
  return data as unknown as SiteSettings;
}

/**
 * Loads the 6 most recent published items across all kinds for the Home page (FR-HOME-01).
 */
export async function getRecentPosts(limit = 6): Promise<Post[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('posts')
    .select('id, kind, slug, title, body_md, excerpt, attribution, status, published_at, created_at, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as unknown as Post[];
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
  const supabase = await createClient();
  const pageSize = limit || (kind === 'quote' ? 20 : 12);

  let query = supabase
    .from('posts')
    .select('id, kind, slug, title, body_md, excerpt, attribution, status, published_at, created_at, updated_at')
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
}

/**
 * Loads a single piece by kind and slug (FR-READ-01).
 */
export async function getPostBySlug(kind: PostKind, slug: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('posts')
    .select('id, kind, slug, title, body_md, excerpt, attribution, status, published_at, created_at, updated_at')
    .eq('status', 'published')
    .eq('kind', kind)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as unknown as Post;
}

/**
 * Loads adjacent published posts (previous and next) within the same section.
 */
export async function getAdjacentPosts(kind: PostKind, currentPost: Post) {
  const supabase = await createClient();
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
}

/**
 * Loads published books ordered by sort_order and publication date (FR-BOOK-01).
 */
export async function getPublishedBooks(): Promise<Book[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('books')
    .select('id, slug, title, subtitle, synopsis_md, excerpt_md, cover_path, cover_alt, progress, purchase_url, release_date, sort_order, status, published_at, created_at, updated_at')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false });

  if (error || !data) return [];
  return data as unknown as Book[];
}

/**
 * Loads a single book by slug.
 */
export async function getBookBySlug(slug: string): Promise<Book | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('books')
    .select('id, slug, title, subtitle, synopsis_md, excerpt_md, cover_path, cover_alt, progress, purchase_url, release_date, sort_order, status, published_at, created_at, updated_at')
    .eq('status', 'published')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as unknown as Book;
}
