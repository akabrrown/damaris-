export interface KeysetCursor {
  publishedAt: string;
  id: string;
}

/**
 * Encodes keyset cursor (published_at, id) as base64url string.
 */
export function encodeCursor(publishedAt: string, id: string): string {
  const payload = JSON.stringify({ publishedAt, id });
  return Buffer.from(payload, 'utf8').toString('base64url');
}

/**
 * Decodes base64url keyset cursor. Returns null if invalid.
 */
export function decodeCursor(cursor: string): KeysetCursor | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.publishedAt === 'string' &&
      typeof parsed.id === 'string'
    ) {
      return {
        publishedAt: parsed.publishedAt,
        id: parsed.id,
      };
    }
    return null;
  } catch {
    return null;
  }
}
