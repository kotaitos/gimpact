import type { AnalysisMode, PeriodUnit } from '@/core';

export type Subcommand = 'summary' | 'daily' | 'weekly' | 'monthly' | 'ownership';

export interface CLIOptions {
  subcommand: Subcommand;
  days?: number;
  since?: Date;
  until?: Date;
  mode: AnalysisMode;
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
