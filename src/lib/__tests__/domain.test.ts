import { describe, it, expect } from 'vitest';
import { generateSlug } from '../slug';
import { calculateReadingTime } from '../reading-time';
import {
  generateConfirmToken,
  hashConfirmToken,
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
} from '../tokens';
import { encodeCursor, decodeCursor } from '../cursor';
import { renderVerse, renderVerseLineHtml, sanitizeMarkdown } from '../content-renderer';
import { subscribeSchema, postInputSchema, bookInputSchema } from '../schemas';

describe('Domain Libraries (TDD)', () => {
  describe('slug generator', () => {
    it('converts titles to valid kebab-case slugs matching schema regex', () => {
      const slug = generateSlug('The Quiet Wind & Rain (Part 1)!');
      expect(slug).toBe('the-quiet-wind-rain-part-1');
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(slug.length).toBeLessThanOrEqual(80);
    });

    it('handles titles with non-latin accents and extra spaces', () => {
      const slug = generateSlug('  Café au Lait — A Journey   ');
      expect(slug).toBe('cafe-au-lait-a-journey');
    });

    it('truncates very long titles safely at word boundary or 80 chars max', () => {
      const longTitle = 'A'.repeat(120);
      const slug = generateSlug(longTitle);
      expect(slug.length).toBeLessThanOrEqual(80);
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    });
  });

  describe('reading time calculator', () => {
    it('returns at least 1 min for short text', () => {
      expect(calculateReadingTime('Just a short reflection.')).toBe(1);
    });

    it('calculates approximately 200 words per minute', () => {
      const text = Array(600).fill('word').join(' ');
      expect(calculateReadingTime(text)).toBe(3);
    });
  });

  describe('tokens', () => {
    it('generates 32-byte confirm token and reproducible SHA-256 hash', () => {
      const { token, hash } = generateConfirmToken();
      expect(token).toHaveLength(64); // 32 bytes hex
      const computedHash = hashConfirmToken(token);
      expect(hash.toString('hex')).toBe(computedHash.toString('hex'));
    });

    it('generates and verifies stateless HMAC-SHA256 unsubscribe tokens in constant time', () => {
      const secret = 'test-secret-key-at-least-32-chars-long';
      const subscriberId = '123e4567-e89b-12d3-a456-426614174000';
      const token = generateUnsubscribeToken(subscriberId, secret);

      const verifiedId = verifyUnsubscribeToken(token, secret);
      expect(verifiedId).toBe(subscriberId);

      // Tampered token fails
      expect(verifyUnsubscribeToken(token + 'tamper', secret)).toBeNull();
      // Different secret fails
      expect(verifyUnsubscribeToken(token, 'different-secret')).toBeNull();
      // Malformed token fails
      expect(verifyUnsubscribeToken('invalidtokenformat', secret)).toBeNull();
    });
  });

  describe('cursor pagination', () => {
    it('encodes and decodes keyset cursor', () => {
      const publishedAt = '2026-10-13T10:00:00.000Z';
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const cursor = encodeCursor(publishedAt, id);
      expect(typeof cursor).toBe('string');

      const decoded = decodeCursor(cursor);
      expect(decoded).toEqual({ publishedAt, id });
    });

    it('returns null on invalid cursor', () => {
      expect(decodeCursor('invalid-base64-payload')).toBeNull();
    });
  });

  describe('content renderer (verse & markdown)', () => {
    it('preserves line breaks, stanzas, and indentation for poems (FR-READ-02)', () => {
      const rawPoem = 'Line 1\n  Indented line 2\n\nStanza 2 line 1\nLine 2';
      const stanzas = renderVerse(rawPoem);
      expect(stanzas).toHaveLength(2);
      expect(stanzas[0]).toEqual(['Line 1', '  Indented line 2']);
      expect(stanzas[1]).toEqual(['Stanza 2 line 1', 'Line 2']);
    });

    it('sanitizes markdown output, disallowing script tags and forcing rel=noopener noreferrer on external links', () => {
      const maliciousMd = '[Click](https://evil.com)<script>alert(1)</script>';
      const html = sanitizeMarkdown(maliciousMd);
      expect(html).not.toContain('<script>');
      expect(html).toContain('rel="noopener noreferrer"');
    });

    it('renders poem lines with inline markdown formatting (italics, bold, links) and leading non-breaking spaces', () => {
      const line = '    *whispers* in **silence** [link](https://example.com)';
      const html = renderVerseLineHtml(line);
      expect(html).toContain('&nbsp;&nbsp;&nbsp;&nbsp;');
      expect(html).toContain('<em>whispers</em>');
      expect(html).toContain('<strong>silence</strong>');
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('rel="noopener noreferrer"');
    });

    it('returns &nbsp; for empty or whitespace-only verse lines', () => {
      expect(renderVerseLineHtml('')).toBe('&nbsp;');
      expect(renderVerseLineHtml('   ')).toBe('&nbsp;');
    });
  });

  describe('schemas validation', () => {
    it('validates subscribe input and rejects filled honeypot', () => {
      expect(subscribeSchema.safeParse({ email: 'Reader@example.com' }).success).toBe(true);
      expect(subscribeSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
      expect(subscribeSchema.safeParse({ email: 'valid@example.com', website: 'bot-fill' }).success).toBe(false);
    });

    it('enforces post constraints: quotes require body <= 600, others require title', () => {
      // Quote valid without title
      expect(
        postInputSchema.safeParse({
          kind: 'quote',
          body_md: 'A short quote under 600 chars.',
          attribution: 'Author',
        }).success
      ).toBe(true);

      // Quote invalid if > 600 chars
      expect(
        postInputSchema.safeParse({
          kind: 'quote',
          body_md: 'x'.repeat(601),
        }).success
      ).toBe(false);

      // Poem invalid without title
      expect(
        postInputSchema.safeParse({
          kind: 'poem',
          body_md: 'Stanza 1',
        }).success
      ).toBe(false);

      // Poem valid with title
      expect(
        postInputSchema.safeParse({
          kind: 'poem',
          title: 'Morning Frost',
          body_md: 'Stanza 1',
        }).success
      ).toBe(true);

      // Post with featured image requires alt text
      expect(
        postInputSchema.safeParse({
          kind: 'poem',
          title: 'Morning Frost',
          body_md: 'Stanza 1',
          featured_image_path: 'https://example.com/artwork.jpg',
        }).success
      ).toBe(false);

      // Post with featured image and alt text passes
      expect(
        postInputSchema.safeParse({
          kind: 'poem',
          title: 'Morning Frost',
          body_md: 'Stanza 1',
          featured_image_path: 'https://example.com/artwork.jpg',
          featured_image_alt: 'Delicate frost on morning pine branches',
          featured_image_caption: 'Oil on canvas, 2024',
        }).success
      ).toBe(true);
    });

    it('enforces book constraints: title, synopsis_md, cover_alt required when cover_path exists', () => {
      expect(
        bookInputSchema.safeParse({
          title: 'Selected Poems',
          synopsis_md: 'A collection of poems.',
          cover_path: 'covers/123/img.webp',
          // cover_alt missing -> should fail
        }).success
      ).toBe(false);

      expect(
        bookInputSchema.safeParse({
          title: 'Selected Poems',
          synopsis_md: 'A collection of poems.',
          cover_path: 'covers/123/img.webp',
          cover_alt: 'Front cover of Selected Poems',
        }).success
      ).toBe(true);
    });
  });
});
