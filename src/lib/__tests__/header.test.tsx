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

import { PublicHeader } from '@/components/public-header';

describe('PublicHeader Component (Mobile Nav & Scroll Dismissal)', () => {
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

  it('renders icon instead of "Menu" text in mobile toggle button', async () => {
    await act(async () => {
      root.render(<PublicHeader authorName="Caroline Damaris Donkor" />);
    });

    const toggleBtn = container.querySelector('button[aria-label="Open navigation menu"]') as HTMLButtonElement;
    expect(toggleBtn).not.toBeNull();
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
    expect(toggleBtn.getAttribute('aria-controls')).toBe('mobile-nav');

    // Should NOT have plain "Menu" text node
    expect(toggleBtn.textContent?.trim()).not.toBe('Menu');

    // Should contain an SVG icon (Menu icon from lucide-react)
    const svgIcon = toggleBtn.querySelector('svg');
    expect(svgIcon).not.toBeNull();
    expect(svgIcon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('switches to close icon and displays mobile nav when clicked', async () => {
    await act(async () => {
      root.render(<PublicHeader authorName="Caroline Damaris Donkor" />);
    });

    const toggleBtn = container.querySelector('button[aria-label="Open navigation menu"]') as HTMLButtonElement;
    
    // Click toggle to open
    await act(async () => {
      toggleBtn.click();
    });

    expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');
    expect(toggleBtn.getAttribute('aria-label')).toBe('Close navigation menu');

    // Mobile nav container exists with id="mobile-nav"
    const mobileNav = container.querySelector('#mobile-nav');
    expect(mobileNav).not.toBeNull();
  });

  it('automatically closes mobile menu when user scrolls beyond threshold', async () => {
    // Set initial scrollY
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });

    await act(async () => {
      root.render(<PublicHeader authorName="Caroline Damaris Donkor" />);
    });

    const toggleBtn = container.querySelector('button[aria-label="Open navigation menu"]') as HTMLButtonElement;
    
    // Open menu
    await act(async () => {
      toggleBtn.click();
    });

    expect(container.querySelector('#mobile-nav')).not.toBeNull();

    // User scrolls page by 50px
    await act(async () => {
      window.scrollY = 50;
      window.dispatchEvent(new Event('scroll'));
    });

    // Menu should auto-dismiss
    expect(container.querySelector('#mobile-nav')).toBeNull();
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
  });
});
