import { formatDateForGit } from './formatter';

/**
 * Get ISO 8601 week number (e.g., "2025-W01")
 */
export function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Get month identifier (YYYY-MM)
 */
export function getMonthIdentifier(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get period identifier based on period unit
 */
export function getPeriodIdentifier(
  date: Date,
  periodUnit: 'daily' | 'weekly' | 'monthly'
): string {
  switch (periodUnit) {
    case 'daily':
      return formatDateForGit(date);
    case 'weekly':
      return getWeekNumber(date);
    case 'monthly':
      return getMonthIdentifier(date);
  }
}
