import type { AggregateAnalysisResult, PeriodAuthorStatsArray } from '../../types';
import type { Filter } from './filter.interface';

/**
 * Filter chain for applying multiple filters
 */
export class FilterChain {
  private readonly filters: Filter[] = [];

  addFilter(filter: Filter): this {
    this.filters.push(filter);
    return this;
  }

  apply(
    data: AggregateAnalysisResult | PeriodAuthorStatsArray
  ): AggregateAnalysisResult | PeriodAuthorStatsArray {
    return this.filters.reduce((result, filter) => filter.apply(result), data);
  }

  isEmpty(): boolean {
    return this.filters.length === 0;
  }
}
