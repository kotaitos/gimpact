import type { AnalysisMode, PeriodUnit } from './index';

/**
 * Time range configuration for analysis
 */
export interface TimeRange {
  since?: Date;
  until?: Date;
  days?: number;
}

/**
 * Options for the contribution analyzer
 */
export interface AnalyzerOptions {
  timeRange?: TimeRange;
  mode?: AnalysisMode;
  periodUnit?: PeriodUnit;
  authors?: string[];
  branch?: string;
  minCommits?: number;
  /** Patterns to exclude from ownership analysis (glob patterns) */
  excludePatterns?: string[];
  /** Whether to respect .gitignore file (default: true) */
  respectGitignore?: boolean;
  /** Filter by directory path (only include files in this directory) */
  directory?: string;
}
