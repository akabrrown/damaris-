'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Poetry', href: '/poetry' },
  { label: 'Stories', href: '/stories' },
  { label: 'Reflections', href: '/reflections' },
  { label: 'Quotes', href: '/quotes' },
  { label: 'Books', href: '/books' },
  { label: 'About', href: '/about' },
];

export interface PublicHeaderProps {
  authorName?: string;
}

export function PublicHeader({ authorName }: PublicHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const displayName = authorName && authorName !== '[Author Name]' ? authorName : "Caroline Damaris Donkor";

  return (
    <header className="w-full border-b border-line bg-paper sticky top-0 z-40">
      <div className="max-w-[1040px] mx-auto px-4 sm:px-6 md:px-8 py-5 flex items-center justify-between">
        {/* Author / Site Wordmark */}
        <Link
          href="/"
          className="font-serif text-2xl sm:text-3xl text-ink tracking-tight hover:text-ink/80 transition-colors"
        >
          {displayName}
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center space-x-6 lg:space-x-8">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-base font-medium transition-all duration-150 py-1 ${
                  isActive
                    ? 'text-ink underline underline-offset-4 decoration-2 decoration-moss font-semibold'
                    : 'text-muted hover:text-ink hover:underline hover:underline-offset-4'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Navigation Toggle (touch target >= 44x44) */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-ink border border-line bg-paper"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <span className="font-sans text-sm font-medium">
            {mobileMenuOpen ? 'Close' : 'Menu'}
          </span>
        </button>
      </div>

      {/* Mobile Navigation List (expandable list, not an off-canvas drawer) */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden border-t border-line bg-paper px-4 py-4 space-y-2"
        >
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 px-2 text-lg min-h-[44px] flex items-center ${
                  isActive
                    ? 'text-ink font-semibold underline underline-offset-4 decoration-moss'
                    : 'text-muted hover:text-ink'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
