import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Notice',
  description: 'How we collect, use, and protect your personal data.',
};

export default function PrivacyPage() {
  return (
    <article className="max-w-[62ch] mx-auto py-6 sm:py-12">
      <div className="w-12 h-1 bg-sage mb-6" aria-hidden="true" />
      <h1 className="font-serif text-3xl sm:text-5xl text-ink font-normal tracking-tight mb-8">
        Privacy Notice
      </h1>

      <div className="prose-reading space-y-6 text-base sm:text-lg leading-relaxed">
        <p>
          This website is a quiet, personal space for writing. We collect the bare minimum amount of personal data required to send you updates when new work is published.
        </p>

        <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal mt-8 mb-4">
          1. What data we collect
        </h2>
        <p>
          We only collect your <strong>email address</strong> and the timestamp of when you requested to subscribe and confirmed your subscription. We do not collect names, phone numbers, home addresses, or payment details.
        </p>

        <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal mt-8 mb-4">
          2. How your email is used
        </h2>
        <p>
          Your email address is used solely to deliver notifications when a new poem, short story, reflection, quote, or book is published by the author. We never sell, rent, trade, or share your email address with third parties or advertisers.
        </p>

        <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal mt-8 mb-4">
          3. Double opt-in and consent
        </h2>
        <p>
          We operate a strict double opt-in procedure. Entering an email in the subscribe box does not subscribe you immediately; you will receive a single confirmation message containing a link. You will only receive publications after clicking to confirm. Unconfirmed requests are automatically purged.
        </p>

        <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal mt-8 mb-4">
          4. Unsubscribing and erasure
        </h2>
        <p>
          Every email we send contains a working, one-click <strong>Unsubscribe</strong> link. You can unsubscribe at any moment without needing an account or password. If you would like your record to be permanently erased from our database, please contact the author and it will be deleted immediately.
        </p>

        <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal mt-8 mb-4">
          5. Cookies and analytics
        </h2>
        <p>
          This website does not use tracking cookies, advertising beacons, or third-party profiling scripts. We do not display cookie consent pop-ups because we do not set any tracking cookies.
        </p>

        <h2 className="font-serif text-xl sm:text-2xl text-ink font-normal mt-8 mb-4">
          6. Legal compliance
        </h2>
        <p>
          This notice is prepared in accordance with the Ghana Data Protection Act, 2012 (Act 843) and international data privacy principles.
        </p>

        <div className="pt-8 border-t border-line text-sm text-muted">
          <p>
            Last updated: October 2026. For questions regarding data protection or to request record removal, please reach out directly to Caroline Damaris Donkor at{' '}
            <a href="mailto:carolinedamaris22@gmail.com" className="text-moss underline underline-offset-2">
              carolinedamaris22@gmail.com
            </a>{' '}
            or via the{' '}
            <Link href="/about" className="text-moss underline underline-offset-2">
              About page
            </Link>.
          </p>
        </div>
      </div>
    </article>
  );
}
