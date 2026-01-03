/**
 * Commit size distribution buckets for histogram
 */
export interface CommitSizeDistribution {
  /** 0-10 lines (Micro) */
  micro: number;
  /** 11-30 lines (Small) */
  small: number;
  /** 31-150 lines (Optimal) */
  optimal: number;
  /** 151-500 lines (High) */
  high: number;
  /** 500+ lines (Huge) */
  huge: number;
}

/**
 * Efficiency analysis for an author
 */
export interface EfficiencyStats {
  /** Author name */
  author: string;
  /** Average lines changed per commit (Total Delta / Commits) */
  efficiency: number;
  /** Efficiency evaluation label */
  efficiencyLabel: string;
  /** Commit size distribution for histogram */
  distribution: CommitSizeDistribution;
  /** Total number of commits */
  totalCommits: number;
}

/**
 * Map of author names to their efficiency stats
 */
export type EfficiencyStatsMap = Record<string, EfficiencyStats>;
