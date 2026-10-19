import { describe, it, expect } from 'vitest';
import { getSectionSegment, getSectionPath, getPiecePath } from '@/lib/routing';

describe('Routing & Section Canonical Paths', () => {
  it('correctly maps singular kinds to plural section segments', () => {
    expect(getSectionSegment('poem')).toBe('poetry');
    expect(getSectionSegment('story')).toBe('stories');
    expect(getSectionSegment('reflection')).toBe('reflections');
    expect(getSectionSegment('quote')).toBe('quotes');
    expect(getSectionSegment('book')).toBe('books');
  });

  it('correctly formats section root paths', () => {
    expect(getSectionPath('poem')).toBe('/poetry');
    expect(getSectionPath('story')).toBe('/stories');
    expect(getSectionPath('reflection')).toBe('/reflections');
    expect(getSectionPath('quote')).toBe('/quotes');
    expect(getSectionPath('book')).toBe('/books');
  });

  it('correctly formats canonical piece detail paths', () => {
    expect(getPiecePath('poem', 'on-the-eve-of-twenty')).toBe('/poetry/on-the-eve-of-twenty');
    expect(getPiecePath('story', 'the-quiet-room')).toBe('/stories/the-quiet-room');
    expect(getPiecePath('reflection', 'on-belonging')).toBe('/reflections/on-belonging');
    expect(getPiecePath('quote', 'fragment-42')).toBe('/quotes/fragment-42');
    expect(getPiecePath('book', 'the-second-arrival')).toBe('/books/the-second-arrival');
  });
});
