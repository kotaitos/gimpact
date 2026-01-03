/**
 * Render a horizontal bar for histogram
 */
export function renderBar(count: number, maxCount: number, maxWidth: number): string {
  if (maxCount === 0) return '';
  const width = Math.round((count / maxCount) * maxWidth);
  return '▓'.repeat(width);
}
