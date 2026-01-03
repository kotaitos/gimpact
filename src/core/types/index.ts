// Analysis mode and period unit types
export type AnalysisMode = 'aggregate' | 'periodic' | 'ownership';
export type PeriodUnit = 'daily' | 'weekly' | 'monthly';

// Analysis result types
export type {
  AggregateAnalysisResult,
  PeriodAuthorStats,
  PeriodAuthorStatsArray,
} from './analysis-result.types';
// Author stats types
export type { AuthorStats, AuthorStatsMap } from './author-stats.types';
// Efficiency types
export type {
  CommitSizeDistribution,
  EfficiencyStats,
  EfficiencyStatsMap,
} from './efficiency.types';

// Options types
export type { AnalyzerOptions, TimeRange } from './options.types';
// Ownership types
export type {
  AuthorOwnership,
  DirectoryOwnership,
  FileOwnership,
  OwnershipAnalysisResult,
} from './ownership.types';
