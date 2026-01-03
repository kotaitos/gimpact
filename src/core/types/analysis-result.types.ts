import type { AuthorStatsMap, EfficiencyStatsMap } from './index';

/**
 * Statistics for a specific period and author combination
 */
export interface PeriodAuthorStats {
  period: string;
  author: string;
  stats: {
    commits: number;
    insertions: number;
    deletions: number;
    filesTouched: number;
  };
}

/**
 * Array of period-grouped author statistics
 */
export type PeriodAuthorStatsArray = PeriodAuthorStats[];

/**
 * Combined analysis result including both regular stats and efficiency analysis
 */
export interface AggregateAnalysisResult {
  /** Regular author statistics */
  stats: AuthorStatsMap;
  /** Efficiency analysis (when authors filter is specified) */
  efficiency: EfficiencyStatsMap;
}
