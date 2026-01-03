/**
 * Format date for Git commands (YYYY-MM-DD)
 */
export function formatDateForGit(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format date for display (YYYY-MM-DD)
 */
export function formatDateForDisplay(date: Date): string {
  return date.toISOString().split('T')[0];
}
