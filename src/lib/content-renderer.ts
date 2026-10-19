import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

/**
 * Parses poem / verse text into structured stanzas and lines.
 * Preserves line breaks, blank-line stanzas, and leading space indentation (FR-READ-02).
 */
export function renderVerse(text: string): string[][] {
  if (!text) return [];

  // Normalize Windows newlines
  const normalized = text.replace(/\r\n/g, '\n');

  // Stanzas separated by 2 or more newlines
  const stanzaBlocks = normalized.split(/\n{2,}/);

  return stanzaBlocks
    .map((stanza) => stanza.split('\n'))
    .filter((stanza) => stanza.length > 0 && stanza.some((line) => line.trim().length > 0));
}

/**
 * Parses markdown to HTML and strictly sanitizes it.
 * Strips dangerous tags (script, iframe, style, object) and forces rel="noopener noreferrer" on links.
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown) return '';

  const rawHtml = marked.parse(markdown, { async: false }) as string;

  return sanitizeHtml(rawHtml, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'pre'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'title'],
      code: ['class'],
    },
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || '';
        const isExternal = href.startsWith('http://') || href.startsWith('https://');
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            ...(isExternal ? { rel: 'noopener noreferrer' } : {}),
          },
        };
      },
    },
  });
}
