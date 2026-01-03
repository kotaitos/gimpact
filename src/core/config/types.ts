import type { AnalysisMode, PeriodUnit } from '../types';

/**
 * Internal resolved options after applying defaults
 */
export interface ResolvedOptions {
  timeRange: {
    since?: Date;
    until?: Date;
    days?: number;
  };
  mode: AnalysisMode;
  periodUnit: PeriodUnit;
  branch?: string;
}

/**
 * Git log query parameters
 */
export interface GitLogQuery {
  since?: string;
  until?: string;
  branch?: string;
}
