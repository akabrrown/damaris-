import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Post } from '@/lib/types';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { RecentWritingShowcase } from '@/components/recent-writing-showcase';

const mockPosts: Post[] = [
  {
    id: 'post-1',
    kind: 'poem',
    slug: 'on-the-eve-of-twenty',
    title: 'On the eve of twenty',
    body_md: 'I stand at the precipice of time,\nwatching shadows dissolve.',
    excerpt: 'I stand at the precipice of time,\nwatching shadows dissolve.',
    attribution: null,
    status: 'published',
    published_at: '2026-10-18T12:00:00Z',
    created_at: '2026-10-18T10:00:00Z',
    updated_at: '2026-10-18T12:00:00Z',
  },
  {
    id: 'post-2',
    kind: 'story',
    slug: 'a-muse-in-my-season',
    title: 'A Muse in my Season',
    body_md: 'The harmattan winds arrived earlier that November than anyone had anticipated.',
    excerpt: 'The harmattan winds arrived earlier that November.',
    attribution: null,
    status: 'published',
    published_at: '2026-10-17T12:00:00Z',
    created_at: '2026-10-17T10:00:00Z',
    updated_at: '2026-10-17T12:00:00Z',
  },
  {
    id: 'post-3',
    kind: 'quote',
    slug: 'quiet-reverence',
    title: 'Quiet Reverence',
    body_md: 'Silence is not the absence of sound, but the presence of attention.',
    excerpt: 'Silence is not the absence of sound, but the presence of attention.',
    attribution: 'Caroline Damaris Donkor',
    status: 'published',
    published_at: '2026-10-16T12:00:00Z',
    created_at: '2026-10-16T10:00:00Z',
    updated_at: '2026-10-16T12:00:00Z',
  },
];

describe('RecentWritingShowcase (Pinterest-inspired Literary Showcase)', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders all posts by default in recent writing showcase', () => {
    act(() => {
      root.render(<RecentWritingShowcase posts={mockPosts} />);
    });
    expect(container.textContent).toContain('On the eve of twenty');
    expect(container.textContent).toContain('A Muse in my Season');
  });

  it('filters posts when clicking genre filter tabs', () => {
    act(() => {
      root.render(<RecentWritingShowcase posts={mockPosts} />);
    });

    const buttons = Array.from(container.querySelectorAll('button[role="tab"]'));
    const poetryBtn = buttons.find((b) => b.textContent?.includes('Poetry')) as HTMLButtonElement;
    expect(poetryBtn).toBeDefined();

    act(() => {
      poetryBtn.click();
    });

    expect(container.textContent).toContain('On the eve of twenty');
    expect(container.textContent).not.toContain('A Muse in my Season');

    const storiesBtn = buttons.find((b) => b.textContent?.includes('Stories')) as HTMLButtonElement;
    expect(storiesBtn).toBeDefined();

    act(() => {
      storiesBtn.click();
    });

    expect(container.textContent).toContain('A Muse in my Season');
    expect(container.textContent).not.toContain('On the eve of twenty');
  });

  it('renders appropriate canonical links for pieces', () => {
    act(() => {
      root.render(<RecentWritingShowcase posts={mockPosts} />);
    });
    const links = Array.from(container.querySelectorAll('a'));
    const poemLink = links.find((l) => l.getAttribute('href') === '/poetry/on-the-eve-of-twenty');
    expect(poemLink).toBeDefined();
  });

  it('displays empty state message when a genre has no posts', () => {
    act(() => {
      root.render(<RecentWritingShowcase posts={mockPosts} />);
    });
    const buttons = Array.from(container.querySelectorAll('button[role="tab"]'));
    const reflectionsBtn = buttons.find((b) => b.textContent?.includes('Reflections')) as HTMLButtonElement;
    expect(reflectionsBtn).toBeDefined();

    act(() => {
      reflectionsBtn.click();
    });

    expect(container.textContent).toContain('No reflections published yet');
  });

  it('displays link text as Read and does not render author name in card footers', () => {
    act(() => {
      root.render(<RecentWritingShowcase posts={mockPosts} />);
    });
    // Check all anchor/read spans
    const readElements = Array.from(container.querySelectorAll('span')).filter((s) =>
      s.textContent?.trim().startsWith('Read')
    );
    expect(readElements.length).toBeGreaterThan(0);
    for (const el of readElements) {
      expect(el.textContent?.trim()).not.toContain('Read piece');
      expect(el.textContent?.trim()).toMatch(/^Read/);
    }

    // Verify writer name is not present in lead footer
    const leadArticle = container.querySelector('article');
    const leadFooter = leadArticle?.querySelector('.border-t');
    expect(leadFooter?.textContent).not.toContain('Caroline Damaris Donkor');
  });
});

