/**
 * Statistics for a single author
 */
export interface AuthorStats {
  commits: number;
  insertions: number;
  deletions: number;
  filesTouched: number;
}

/**
 * Map of author names to their aggregated statistics
 */
export type AuthorStatsMap = Record<string, AuthorStats>;
