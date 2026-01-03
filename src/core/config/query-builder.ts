import { formatDateForGit, validateTimeRange } from '../time';
import type { GitLogQuery, ResolvedOptions } from './types';

/**
 * Build git log query parameters from resolved options
 */
export function buildLogQuery(opts: ResolvedOptions): GitLogQuery {
  const query: GitLogQuery = {
    branch: opts.branch,
  };

  if (opts.timeRange.since || opts.timeRange.until || opts.timeRange.days) {
    if (opts.timeRange.since) {
      validateTimeRange(opts.timeRange.since, opts.timeRange.until);
      query.since = formatDateForGit(opts.timeRange.since);
    } else if (opts.timeRange.days) {
      // Use "X days ago" format for Git, which is more reliable
      query.since = `${opts.timeRange.days} days ago`;
    }

    if (opts.timeRange.until) {
      query.until = formatDateForGit(opts.timeRange.until);
    }
  }

  return query;
}
