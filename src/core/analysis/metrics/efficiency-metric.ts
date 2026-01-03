import { EFFICIENCY_THRESHOLDS } from '../../constants';
import type { CommitSizeDistribution, EfficiencyStats, EfficiencyStatsMap } from '../../types';
import type { CommitData } from '../log-parsers';

/**
 * Get efficiency label based on lines per commit
 */
export function getEfficiencyLabel(efficiency: number): string {
  if (efficiency < EFFICIENCY_THRESHOLDS.MICRO) {
    return '🟡 Micro';
  }
  if (
    efficiency >= EFFICIENCY_THRESHOLDS.OPTIMAL_MIN &&
    efficiency <= EFFICIENCY_THRESHOLDS.OPTIMAL_MAX
  ) {
    return '✅ Optimal';
  }
  if (efficiency > EFFICIENCY_THRESHOLDS.HUGE) {
    return '🚨 Huge';
  }
  if (efficiency > EFFICIENCY_THRESHOLDS.OPTIMAL_MAX) {
    return '⚠️ High Load';
  }
  // Between MICRO and OPTIMAL_MIN (10-30)
  return '🟡 Small';
}

/**
 * Classify a single commit's size into a bucket
 */
function classifyCommitSize(linesChanged: number): keyof CommitSizeDistribution {
  if (linesChanged <= EFFICIENCY_THRESHOLDS.MICRO) {
    return 'micro';
  }
  if (linesChanged < EFFICIENCY_THRESHOLDS.OPTIMAL_MIN) {
    return 'small';
  }
  if (linesChanged <= EFFICIENCY_THRESHOLDS.OPTIMAL_MAX) {
    return 'optimal';
  }
  if (linesChanged <= EFFICIENCY_THRESHOLDS.HUGE) {
    return 'high';
  }
  return 'huge';
}

/**
 * Analyze efficiency stats for a single author
 * @param authorName - Author name
 * @param commits - All commits (will filter by author)
 * @returns Efficiency stats for the author
 */
export function analyzeAuthorEfficiency(
  authorName: string,
  commits: CommitData[]
): EfficiencyStats {
  const authorCommits = commits.filter((c) => c.author === authorName);

  const distribution: CommitSizeDistribution = {
    micro: 0,
    small: 0,
    optimal: 0,
    high: 0,
    huge: 0,
  };

  if (authorCommits.length === 0) {
    return {
      author: authorName,
      efficiency: 0,
      efficiencyLabel: getEfficiencyLabel(0),
      distribution,
      totalCommits: 0,
    };
  }

  // Calculate efficiency and distribution
  let totalDelta = 0;
  for (const commit of authorCommits) {
    const linesChanged = commit.insertions + commit.deletions;
    totalDelta += linesChanged;

    // Classify into distribution bucket
    const bucket = classifyCommitSize(linesChanged);
    distribution[bucket]++;
  }

  const efficiency = Math.round(totalDelta / authorCommits.length);

  return {
    author: authorName,
    efficiency,
    efficiencyLabel: getEfficiencyLabel(efficiency),
    distribution,
    totalCommits: authorCommits.length,
  };
}

/**
 * Analyze efficiency stats for all authors in the commit data
 * @param commits - All commits
 * @returns Map of author names to their efficiency stats
 */
export function analyzeAllEfficiency(commits: CommitData[]): EfficiencyStatsMap {
  // Get unique authors
  const authors = new Set<string>();
  for (const commit of commits) {
    authors.add(commit.author);
  }

  const result: EfficiencyStatsMap = {};

  for (const author of authors) {
    result[author] = analyzeAuthorEfficiency(author, commits);
  }

  return result;
}
