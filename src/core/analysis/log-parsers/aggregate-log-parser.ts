import type { AuthorStatsMap } from '../../types';

// Internal type for tracking files during parsing
type AuthorFilesMap = Record<string, Set<string>>;

/**
 * Parse git log output into aggregated author statistics
 * @param log - git log --numstat output
 * @param authors - Optional author filter (case-insensitive)
 * @returns Aggregated stats by author
 */
export function parseAggregateStats(log: string, authors?: string[]): AuthorStatsMap {
  const stats: AuthorStatsMap = {};
  const authorFiles: AuthorFilesMap = {};
  const lines = log.split('\n');
  let currentAuthor = '';

  const authorFilter = authors?.map((a) => a.toLowerCase());

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0) {
      continue;
    }

    if (trimmedLine.includes('\t')) {
      const parts = trimmedLine.split('\t');
      const insertions = parseInt(parts[0], 10) || 0;
      const deletions = parseInt(parts[1], 10) || 0;
      const filePath = parts[2];

      if (currentAuthor && stats[currentAuthor]) {
        stats[currentAuthor].insertions += insertions;
        stats[currentAuthor].deletions += deletions;
        if (filePath) {
          authorFiles[currentAuthor].add(filePath);
        }
      }
    } else {
      currentAuthor = trimmedLine;

      if (authorFilter && !authorFilter.includes(currentAuthor.toLowerCase())) {
        currentAuthor = '';
        continue;
      }

      if (!stats[currentAuthor]) {
        stats[currentAuthor] = {
          commits: 0,
          insertions: 0,
          deletions: 0,
          filesTouched: 0,
        };
        authorFiles[currentAuthor] = new Set();
      }

      stats[currentAuthor].commits++;
    }
  }

  // Convert file sets to counts
  for (const author of Object.keys(stats)) {
    stats[author].filesTouched = authorFiles[author]?.size ?? 0;
  }

  return stats;
}
