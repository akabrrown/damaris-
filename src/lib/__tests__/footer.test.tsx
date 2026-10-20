import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

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

import { PublicFooter } from '@/components/public-footer';

describe('PublicFooter Social Handles Card', () => {
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

  it('renders modern social handles for Instagram, X, and Medium with correct URLs', async () => {
    await act(async () => {
      root.render(<PublicFooter authorName="Caroline Damaris Donkor" />);
    });

    const socialCard = container.querySelector('.social-card');
    expect(socialCard).not.toBeNull();

    // Check Instagram
    const instagramLink = container.querySelector('a[href*="instagram.com"]');
    expect(instagramLink).not.toBeNull();
    expect(instagramLink?.getAttribute('href')).toContain('damaris__caroline');
    expect(instagramLink?.getAttribute('target')).toBe('_blank');
    expect(instagramLink?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(instagramLink?.classList.contains('social-instagram')).toBe(true);

    // Check X
    const xLink = container.querySelector('a[href*="x.com"]');
    expect(xLink).not.toBeNull();
    expect(xLink?.getAttribute('href')).toBe('https://x.com/carolinedonkor?s=11');
    expect(xLink?.getAttribute('target')).toBe('_blank');
    expect(xLink?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(xLink?.classList.contains('social-x')).toBe(true);

    // Check Medium
    const mediumLink = container.querySelector('a[href*="medium.com"]');
    expect(mediumLink).not.toBeNull();
    expect(mediumLink?.getAttribute('href')).toBe('https://medium.com/@carolinedamaris22');
    expect(mediumLink?.getAttribute('target')).toBe('_blank');
    expect(mediumLink?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(mediumLink?.classList.contains('social-medium')).toBe(true);

    // Check SVGs
    const svgs = socialCard?.querySelectorAll('svg');
    expect(svgs?.length).toBe(3);
  });
});
