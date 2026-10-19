/**
 * Calculates estimated reading time in minutes (words / 200 wpm, min 1 minute).
 */
export function calculateReadingTime(text: string): number {
  if (!text || !text.trim()) return 1;

  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return Math.max(1, minutes);
}
