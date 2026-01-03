import type { AggregateAnalysisResult, PeriodAuthorStatsArray } from '../../types';
import type { Filter } from './filter.interface';

/**
 * Filter by author names
 */
export class AuthorFilter implements Filter {
  constructor(private authors: string[]) {}

  apply(
    result: AggregateAnalysisResult | PeriodAuthorStatsArray
  ): AggregateAnalysisResult | PeriodAuthorStatsArray {
    if (Array.isArray(result)) {
      // PeriodAuthorStatsArray
      const authorFilter = this.authors.map((a) => a.toLowerCase());
      return result.filter((item) => authorFilter.includes(item.author.toLowerCase()));
    } else {
      // AggregateAnalysisResult
      const authorFilter = this.authors.map((a) => a.toLowerCase());
      const filteredStats: typeof result.stats = {};
      const filteredEfficiency: typeof result.efficiency = {};

      for (const [author, stats] of Object.entries(result.stats)) {
        if (authorFilter.includes(author.toLowerCase())) {
          filteredStats[author] = stats;
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
