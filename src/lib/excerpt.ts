/**
 * Utility functions for stripping Markdown and autogenerating clean excerpts
 * for poetry, stories, reflections, cards, RSS, and notification previews.
 */

/**
 * Strips common Markdown formatting syntax into clean plain text for excerpts and previews.
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';

  return (
    text
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove images ![alt](url)
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
      // Replace links [text](url) with just text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      // Remove headers #, ##, etc.
      .replace(/^#{1,6}\s+(.*)$/gm, '')
      // Remove blockquotes >
      .replace(/^>\s+/gm, '')
      // Remove horizontal rules
      .replace(/^([-*_]){3,}\s*$/gm, '')
      // Remove bold and italics
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // Remove strikethrough
      .replace(/~~(.*?)~~/g, '$1')
      // Remove HTML tags
      .replace(/<[^>]+>/g, '')
      // Normalize whitespace
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{2,}/g, '\n')
      .trim()
  );
}

/**
 * Automatically generates a concise, readable excerpt from markdown content.
 * - For poetry: extracts the first 1-2 non-empty verse lines.
 * - For prose (stories, reflections): extracts opening text up to maxLength without cutting words.
 */
export function generateExcerpt(
  content: string,
  kind?: string,
  maxLength: number = 240
): string {
  if (!content || !content.trim()) return '';

  if (kind === 'poem') {
    const rawLines = content.replace(/\r\n/g, '\n').split('\n');
    const validLines: string[] = [];

    for (const rawLine of rawLines) {
      const stripped = stripMarkdown(rawLine).trim();
      if (stripped.length > 0 && !rawLine.trim().startsWith('#')) {
        validLines.push(stripped);
        if (validLines.length === 2) break;
      }
    }

    if (validLines.length === 0) return '';
    const chosen = validLines.join('\n');
    if (chosen.length <= maxLength) {
      return chosen;
    }
    return truncateWords(chosen, maxLength);
  }

  // For stories, reflections, or general prose
  const cleaned = stripMarkdown(content);
  // Collapse whitespace
  const singleLine = cleaned.replace(/\s+/g, ' ').trim();
  if (!singleLine) return '';

  if (singleLine.length <= maxLength) {
    return singleLine;
  }

  return truncateWords(singleLine, maxLength);
}

function truncateWords(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Find last space before (maxLength - 1)
  const truncated = text.slice(0, maxLength - 1);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.4) {
    return `${truncated.slice(0, lastSpace).replace(/[,;:.!?-]+$/, '')}…`;
  }

  return `${truncated}…`;
}
