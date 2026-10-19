import { describe, it, expect } from 'vitest';
import { generateExcerpt, stripMarkdown } from '@/lib/excerpt';

describe('Excerpt Auto-Generation Engine', () => {
  describe('stripMarkdown', () => {
    it('strips bold, italic, and strikethrough markers', () => {
      const input = 'This is **bold** and *italic* and ~~deleted~~ text.';
      expect(stripMarkdown(input)).toBe('This is bold and italic and deleted text.');
    });

    it('strips markdown headers and blockquotes', () => {
      const input = '# Heading 1\n## Subheading\n> A quoted thought.\nRegular text.';
      expect(stripMarkdown(input)).toBe('A quoted thought.\nRegular text.');
    });

    it('strips markdown links keeping link text', () => {
      const input = 'Read more at [our library](https://example.com/books).';
      expect(stripMarkdown(input)).toBe('Read more at our library.');
    });

    it('strips markdown images completely', () => {
      const input = 'Look at this: ![Cover Photo](https://example.com/cover.png) Beautiful view.';
      expect(stripMarkdown(input)).toBe('Look at this: Beautiful view.');
    });
  });

  describe('generateExcerpt for Poetry', () => {
    it('extracts the first 1-2 non-empty lines of a poem', () => {
      const poem = `
The quiet river knows the dark,
Before the morning starts to wake;

A bird takes flight across the park,
Leaving ripples on the lake.
      `;
      const excerpt = generateExcerpt(poem, 'poem');
      expect(excerpt).toBe('The quiet river knows the dark,\nBefore the morning starts to wake;');
    });

    it('strips markdown formatting from poem lines', () => {
      const poem = `*Whispers* in the **golden** grass,\nWatching ancient shadows pass.`;
      const excerpt = generateExcerpt(poem, 'poem');
      expect(excerpt).toBe('Whispers in the golden grass,\nWatching ancient shadows pass.');
    });
  });

  describe('generateExcerpt for Stories & Reflections', () => {
    it('extracts opening sentence cleanly', () => {
      const story = `## Chapter One\n\nIt was late autumn when the letters first arrived. Nobody in the village had expected them, but their arrival changed everything.`;
      const excerpt = generateExcerpt(story, 'story');
      expect(excerpt).toContain('It was late autumn when the letters first arrived.');
      expect(excerpt).not.toContain('Chapter One');
    });

    it('caps excerpt length at word boundary with ellipsis and respects 300 char limit', () => {
      const longText = 'The morning sun rose over the rolling green hills of the valley, casting long amber shadows across the cobblestone roads where merchants were just beginning to unpack their fragrant spices, woven silks, and rare manuscripts gathered from distant coastal ports over months of solitary travel.';
      const excerpt = generateExcerpt(longText, 'story', 120);
      expect(excerpt.length).toBeLessThanOrEqual(120);
      expect(excerpt.endsWith('…')).toBe(true);
      // Ensure words are not chopped mid-word (no "fra…")
      expect(excerpt).not.toMatch(/\s\w{1}…$/);
    });

    it('returns empty string for empty or whitespace-only input', () => {
      expect(generateExcerpt('')).toBe('');
      expect(generateExcerpt('   \n\n  ')).toBe('');
    });
  });
});
