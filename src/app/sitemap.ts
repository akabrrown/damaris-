import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getEnv } from '@/lib/env';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const env = getEnv();
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;
  const supabase = await createClient();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/poetry`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/stories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/reflections`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/quotes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/books`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Published posts
  const { data: posts } = await supabase
    .from('posts')
    .select('kind, slug, updated_at')
    .eq('status', 'published');

  const postRoutes: MetadataRoute.Sitemap = (posts || []).map((post) => {
    const section = post.kind === 'story' ? 'stories' : post.kind === 'reflection' ? 'reflections' : post.kind;
    return {
      url: `${baseUrl}/${section}/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: 'monthly',
      priority: 0.7,
    };
  });

  // Published books
  const { data: books } = await supabase
    .from('books')
    .select('slug, updated_at')
    .eq('status', 'published');

  const bookRoutes: MetadataRoute.Sitemap = (books || []).map((book) => ({
    url: `${baseUrl}/books/${book.slug}`,
    lastModified: new Date(book.updated_at),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...postRoutes, ...bookRoutes];
}
