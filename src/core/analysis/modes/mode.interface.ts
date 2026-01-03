import type { ResolvedOptions } from '../../config';
import type { GitClient } from '../../git';
import type {
  AggregateAnalysisResult,
  OwnershipAnalysisResult,
  PeriodAuthorStatsArray,
} from '../../types';

/**
 * Analysis mode interface for different analysis modes
 */
export interface AnalysisMode {
  handle(
    options: ResolvedOptions,
    gitClient: GitClient,
    originalOptions: { authors?: string[]; directory?: string }
  ): Promise<AggregateAnalysisResult | PeriodAuthorStatsArray | OwnershipAnalysisResult>;
}
