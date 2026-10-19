import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEnv } from '@/lib/env';

export const revalidate = 300; // 5 minutes cache

export async function GET() {
  const supabase = await createClient();
  const env = getEnv();

  // Load latest 30 published items
  const { data: posts } = await supabase
    .from('posts')
    .select('id, kind, slug, title, body_md, excerpt, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(30);

  const { data: settings } = await supabase
    .from('site_settings')
    .select('site_title, tagline, author_name')
    .eq('id', 1)
    .single();

  const siteTitle = settings?.site_title || 'Carolinedamaris';
  const authorName = settings?.author_name || 'Caroline Damaris Donkor';
  const tagline = settings?.tagline || 'I give the unsaid a language of its own';
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;

  const rssItems = (posts || []).map((post) => {
    const section = post.kind === 'story' ? 'stories' : post.kind === 'reflection' ? 'reflections' : post.kind;
    const postUrl = `${siteUrl}/${section}/${post.slug}`;
    const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : new Date().toUTCString();
    const title = post.title || post.body_md.slice(0, 50);
    const description = post.excerpt || post.body_md.slice(0, 300);

    return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${post.kind}</category>
      <description><![CDATA[${description}]]></description>
      <author>${authorName}</author>
    </item>
    `.trim();
  }).join('\n    ');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${siteTitle}]]></title>
    <link>${siteUrl}</link>
    <description><![CDATA[${tagline}]]></description>
    <language>en</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItems}
  </channel>
</rss>`.trim();

  return new NextResponse(rssXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
