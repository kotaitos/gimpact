// Core public API
export { analyzeContributions } from './analysis';
export type { ContributorType, ContributorTypeInfo } from './classifier/contributor';
// Contributor
export {
  calculateAverageFilesTouched,
  classifyAllContributors,
  classifyContributor,
  getContributorTypeInfo,
} from './classifier/contributor';
export type { GitLogQuery, ResolvedOptions } from './config';
// Config
export { buildLogQuery, resolveOptions } from './config';
// Constants
export {
  DEFAULT_DAYS,
  DEFAULT_MODE,
  DEFAULT_PERIOD_UNIT,
  VALID_MODES,
  VALID_PERIOD_UNITS,
} from './constants';
export type { GitClient } from './git';
export { createGitClient } from './git';
// Time utilities
export {
  daysAgo,
  formatDateForDisplay,
  formatDateForGit,
  getMonthIdentifier,
  getWeekNumber,
  validateTimeRange,
} from './time';
// Types
export type {
  AggregateAnalysisResult,
  AnalysisMode,
  AnalyzerOptions,
  AuthorOwnership,
  AuthorStats,
  AuthorStatsMap,
  CommitSizeDistribution,
  DirectoryOwnership,
  EfficiencyStats,
  EfficiencyStatsMap,
  FileOwnership,
  OwnershipAnalysisResult,
  PeriodAuthorStatsArray,
  PeriodUnit,
  TimeRange,
} from './types';
