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
        {/* Footer Subscribe Form */}
        <div className="max-w-xl mb-12">
          <SubscribeForm
            layout="compact"
            heading="Receive new writing in your inbox"
            helper="One quiet email when a piece is published. Double opt-in, no spam, cancel anytime."
          />
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
