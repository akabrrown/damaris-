/**
 * Generates a URL-friendly slug matching schema check constraint:
 * slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80
 */
export function generateSlug(title: string): string {
  if (!title) return 'untitled';

  let slug = title
    // Normalize unicode accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Lowercase
    .toLowerCase()
    // Replace non-alphanumeric characters with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '');

  if (!slug) {
    slug = 'item';
  }

  // Cap at 80 characters without cutting in the middle of a hyphen
  if (slug.length > 80) {
    slug = slug.substring(0, 80).replace(/-+$/, '');
  }

  return slug;
}
