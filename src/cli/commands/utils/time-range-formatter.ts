import { DEFAULT_DAYS } from '@/core';
import type { CLIOptions } from '../../types';

/**
 * Build human-readable time range description
 * @param options - CLI options
 * @returns Time range description string
 */
export function buildTimeRangeDescription(options: CLIOptions): string {
  if (options.since && options.until) {
    return `${options.since.toISOString().split('T')[0]} to ${options.until.toISOString().split('T')[0]}`;
  }
  if (options.since) {
    return `Since ${options.since.toISOString().split('T')[0]}`;
  }
  if (options.until) {
    return `Until ${options.until.toISOString().split('T')[0]}`;
  }

  const days = options.days ?? DEFAULT_DAYS;
  return `Last ${days} day${days === 1 ? '' : 's'}`;
}
