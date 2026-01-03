import { getPeriodIdentifier } from '../../time';
import type { AuthorStats, PeriodAuthorStatsArray, PeriodUnit } from '../../types';

/**
 * Parse git log output into period-grouped statistics
 * @param log - git log --numstat output
 * @param periodUnit - Period unit for grouping
 * @param authors - Optional author filter (case-insensitive)
 * @returns Stats grouped by period and author
 */
export function parsePeriodStats(
  log: string,
  periodUnit: PeriodUnit,
  authors?: string[]
): PeriodAuthorStatsArray {
  const grouped = new Map<string, Map<string, AuthorStats>>();
  const lines = log.split('\n');
  let currentAuthor = '';
  let currentPeriod = '';

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

      if (currentAuthor && currentPeriod) {
        if (!grouped.has(currentPeriod)) {
          grouped.set(currentPeriod, new Map());
        }

        const periodMap = grouped.get(currentPeriod)!;
        if (!periodMap.has(currentAuthor)) {
          periodMap.set(currentAuthor, {
            commits: 0,
            insertions: 0,
            deletions: 0,
            filesTouched: 0,
          });
        }

        const stats = periodMap.get(currentAuthor)!;
        stats.insertions += insertions;
        stats.deletions += deletions;
        stats.filesTouched++;
      }
    } else {
      // Format: "Author Name|2025-12-31 12:34:56 +0900"
      const parts = trimmedLine.split('|');
      if (parts.length === 2) {
        currentAuthor = parts[0];
        const dateStr = parts[1];
        const commitDate = new Date(dateStr);

        if (authorFilter && !authorFilter.includes(currentAuthor.toLowerCase())) {
          currentAuthor = '';
          currentPeriod = '';
          continue;
        }

        currentPeriod = getPeriodIdentifier(commitDate, periodUnit);

        if (!grouped.has(currentPeriod)) {
          grouped.set(currentPeriod, new Map());
        }

        const periodMap = grouped.get(currentPeriod)!;
        if (!periodMap.has(currentAuthor)) {
          periodMap.set(currentAuthor, {
            commits: 0,
            insertions: 0,
            deletions: 0,
            filesTouched: 0,
          });
        }

        const stats = periodMap.get(currentAuthor)!;
        stats.commits++;
      }
    }
  }

  return convertToSortedArray(grouped);
}

function convertToSortedArray(
  grouped: Map<string, Map<string, AuthorStats>>
): PeriodAuthorStatsArray {
  const result: PeriodAuthorStatsArray = [];

  for (const [period, authorMap] of grouped.entries()) {
    for (const [author, stats] of authorMap.entries()) {
      result.push({ period, author, stats });
    }
  }

  result.sort((a, b) => {
    if (a.period !== b.period) {
      return b.period.localeCompare(a.period);
    }
    const impactA = a.stats.insertions + a.stats.deletions;
    const impactB = b.stats.insertions + b.stats.deletions;
    return impactB - impactA;
  });

  return result;
}
