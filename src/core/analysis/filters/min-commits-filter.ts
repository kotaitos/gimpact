import type { AggregateAnalysisResult, PeriodAuthorStatsArray } from '../../types';
import type { Filter } from './filter.interface';

/**
 * Filter by minimum commits
 */
export class MinCommitsFilter implements Filter {
  constructor(private minCommits: number) {}

  apply(
    result: AggregateAnalysisResult | PeriodAuthorStatsArray
  ): AggregateAnalysisResult | PeriodAuthorStatsArray {
    if (Array.isArray(result)) {
      // PeriodAuthorStatsArray - filter by commits count
      return result.filter((item) => item.stats.commits >= this.minCommits);
    } else {
      // AggregateAnalysisResult
      const filteredStats: typeof result.stats = {};
      const filteredEfficiency: typeof result.efficiency = {};

      for (const [author, authorStats] of Object.entries(result.stats)) {
        if (authorStats.commits >= this.minCommits) {
          filteredStats[author] = authorStats;
          if (result.efficiency[author]) {
            filteredEfficiency[author] = result.efficiency[author];
          }
        }
      }

      return {
        stats: filteredStats,
        efficiency: filteredEfficiency,
      };
    }
  }
}
