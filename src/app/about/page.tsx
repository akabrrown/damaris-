import React from 'react';
import Image from 'next/image';
import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/queries';
import { sanitizeMarkdown } from '@/lib/content-renderer';

export const metadata: Metadata = {
  title: 'About the Author',
  description: 'Biography, background, and contact details.',
};

export const revalidate = 3600;

export default async function AboutPage() {
  const settings = await getSiteSettings();

  const authorName = settings?.author_name || 'Caroline Damaris Donkor';
  const defaultBio = 'Caroline Damaris Donkor is a Ghanaian writer whose work explores identity, womanhood, grief, becoming, love, and the quiet weight of everyday life. Through her writing, she gives language to the emotions and experiences often left unspoken, inviting readers to pause, reflect, and find meaning in what is deeply felt.';
  const aboutHtml = sanitizeMarkdown(settings?.about_md || defaultBio);
  const photoPath = settings?.about_photo_path;
  const photoAlt = settings?.about_photo_alt || `Photograph of ${authorName}`;
  const contactEmail = settings?.contact_email || 'carolinedamaris22@gmail.com';
  const socialLinks = settings?.social_links || [];

  return (
    <article className="max-w-[800px] mx-auto py-4 sm:py-8">
      <div className="w-12 h-1 bg-sage mb-6" aria-hidden="true" />
      <h1 className="font-serif text-3xl sm:text-5xl text-ink font-normal tracking-tight mb-8">
        About {authorName}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start mb-12">
        {/* Author Photo */}
        {photoPath && (
          <div className="md:col-span-5 relative aspect-[4/5] w-full max-w-[320px] mx-auto md:mx-0 border border-line bg-paper-deep overflow-hidden">
            <Image
              src={photoPath}
              alt={photoAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 320px"
              priority
            />
          </div>
        )}

        {/* Bio Text */}
        <div className={photoPath ? 'md:col-span-7' : 'md:col-span-12'}>
          {aboutHtml ? (
            <div
              className="prose-reading leading-relaxed"
              dangerouslySetInnerHTML={{ __html: aboutHtml }}
            />
          ) : (
            <p className="prose-reading text-muted italic">
              About information will be updated soon.
            </p>
          )}

          {/* Contact & Social Links */}
          <div className="mt-8 pt-6 border-t border-line space-y-4">
            {contactEmail && (
              <div>
                <span className="text-xs uppercase tracking-wider text-muted block mb-1">
                  Contact
                </span>
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-base text-moss hover:text-ink underline underline-offset-4"
                >
                  {contactEmail}
                </a>
              </div>
            )}

            {socialLinks.length > 0 && (
              <div>
                <span className="text-xs uppercase tracking-wider text-muted block mb-2">
                  Follow &amp; Connect
                </span>
                <ul className="flex flex-wrap gap-4 list-none p-0 m-0">
                  {socialLinks.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-moss hover:text-ink underline underline-offset-4 min-h-[44px] inline-flex items-center"
                      >
                        {link.label} &rarr;
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
