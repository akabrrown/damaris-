import { PostKind } from './schemas';

export type SectionKind = PostKind | 'book';

/**
 * Returns the public plural route segment for a piece kind:
 * - 'poem' -> 'poetry'
 * - 'story' -> 'stories'
 * - 'reflection' -> 'reflections'
 * - 'quote' -> 'quotes'
 * - 'book' -> 'books'
 */
export function getSectionSegment(kind: string): string {
  switch (kind) {
    case 'poem':
    case 'poetry':
      return 'poetry';
    case 'story':
    case 'stories':
      return 'stories';
    case 'reflection':
    case 'reflections':
      return 'reflections';
    case 'quote':
    case 'quotes':
      return 'quotes';
    case 'book':
    case 'books':
      return 'books';
    default:
      return kind;
  }
}

/**
 * Returns the root path for a section: e.g. '/poetry', '/stories', '/reflections', '/quotes', '/books'
 */
export function getSectionPath(kind: string): string {
  return `/${getSectionSegment(kind)}`;
}

/**
 * Returns the canonical detail path for a piece: e.g. '/poetry/on-the-eve-of-twenty'
 */
export function getPiecePath(kind: string, slug: string): string {
  return `/${getSectionSegment(kind)}/${slug}`;
}
