import type { Metadata } from 'next';
import { Newsreader, Hanken_Grotesk } from 'next/font/google';
import './globals.css';
import { PublicHeader } from '@/components/public-header';
import { PublicFooter } from '@/components/public-footer';
import { getSiteSettings } from '@/lib/queries';

const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-hanken',
});

export const metadata: Metadata = {
  title: {
    template: "%s | Caroline Damaris Donkor",
    default: "Caroline Damaris Donkor — I give the unsaid a language of its own",
  },
  description: "A quiet, text-first home for the poetry, short stories, reflections, and quotes of Ghanaian writer Caroline Damaris Donkor.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings().catch(() => null);
  const authorName = settings?.author_name;

  return (
    <html lang="en" className={`${newsreader.variable} ${hankenGrotesk.variable}`}>
      <body className="bg-paper text-ink min-h-screen flex flex-col font-sans selection:bg-sage-soft selection:text-ink">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-sage focus:text-ink focus:border focus:border-ink"
        >
          Skip to content
        </a>
        <PublicHeader authorName={authorName} />
        <main id="main-content" className="flex-1 w-full max-w-[1040px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
          {children}
        </main>
        <PublicFooter authorName={authorName} />
      </body>
    </html>
  );
}
