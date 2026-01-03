import type {
  AggregateAnalysisResult,
  OwnershipAnalysisResult,
  PeriodAuthorStatsArray,
} from '@/core';

/**
 * Printer interface for printing analysis results
 */
export interface Printer {
  print(
    result: AggregateAnalysisResult | PeriodAuthorStatsArray | OwnershipAnalysisResult,
    timeRangeDescription: string
  ): void;
}
