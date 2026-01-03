import type { AggregateAnalysisResult, PeriodAuthorStatsArray } from '../../types';

/**
 * Filter interface for filtering analysis results
 */
export interface Filter {
  apply(
    result: AggregateAnalysisResult | PeriodAuthorStatsArray
  ): AggregateAnalysisResult | PeriodAuthorStatsArray;
}
