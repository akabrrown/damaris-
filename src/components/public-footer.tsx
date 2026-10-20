'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SubscribeForm } from './subscribe-form';

export interface PublicFooterProps {
  authorName?: string;
}

export function PublicFooter({ authorName }: PublicFooterProps) {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const displayName = authorName && authorName !== '[Author Name]' ? authorName : "Caroline Damaris Donkor";

  return (
    <footer className="w-full bg-paper-deep border-t border-line mt-16 sm:mt-24">
      <div className="max-w-[1040px] mx-auto px-4 sm:px-6 md:px-8 py-12">
        {/* Footer Subscribe Form & Social Handles Card */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="max-w-xl flex-1">
            <SubscribeForm
              layout="compact"
              heading="Receive new writing in your inbox"
              helper="One quiet email when a piece is published. Double opt-in, no spam, cancel anytime."
            />
          </div>

          {/* Social Handles Card */}
          <div className="flex flex-col items-start lg:items-end">
            <span className="text-xs uppercase tracking-wider text-muted font-medium block mb-3">
              Connect &amp; Follow
            </span>
            <div className="social-card" aria-label="Social media profiles">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/damaris__caroline?xtok=dnNqNXhvOXZldzFl&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram (@damaris__caroline)"
                className="social-container social-instagram"
              >
                <svg className="social-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* X (formerly Twitter) */}
              <a
                href="https://x.com/carolinedonkor?s=11"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (formerly Twitter @carolinedonkor)"
                className="social-container social-x"
              >
                <svg className="social-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Medium */}
              <a
                href="https://medium.com/@carolinedamaris22"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Medium (@carolinedamaris22)"
                className="social-container social-medium"
              >
                <svg className="social-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2.846 6.887c.03-.295-.083-.586-.303-.784l-2.24-2.7v-.403h6.956l5.378 11.795 4.728-11.795h6.633v.403l-1.923 1.84c-.167.143-.247.36-.21.579v12.355c-.037.219.043.436.21.579l1.884 1.84v.403h-9.524v-.403l1.943-1.879c.19-.19.19-.247.19-.54V9.011l-5.418 13.789h-.738L3.923 9.011v8.524c-.048.371.077.74.335 1.006l2.531 3.072v.403H0v-.403l2.531-3.072c.257-.266.376-.635.315-1.006V6.887z" />
                </svg>
              </a>

              {/* Email */}
              <a
                href="mailto:carolinedamaris22@gmail.com"
                aria-label="Email (carolinedamaris22@gmail.com)"
                className="social-container social-email"
              >
                <svg className="social-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Meta & Legal */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 border-t border-line/60 text-sm text-muted">
          <p className="m-0">
            &copy; {currentYear} {displayName}. All rights reserved.
          </p>

          <div className="flex items-center space-x-6">
            <Link
              href="/privacy"
              className="text-moss hover:text-ink underline underline-offset-2 min-h-[44px] flex items-center"
            >
              Privacy Notice
            </Link>
            <Link
              href="/feed.xml"
              className="text-moss hover:text-ink underline underline-offset-2 min-h-[44px] flex items-center"
            >
              RSS Feed
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
