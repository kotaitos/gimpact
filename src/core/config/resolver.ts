import { DEFAULT_DAYS } from '../constants';
import { DEFAULT_MODE } from '../constants/analysis-mode.constants';
import { DEFAULT_PERIOD_UNIT } from '../constants/period-unit.constants';
import type { AnalyzerOptions } from '../types';
import type { ResolvedOptions } from './types';

/**
 * Resolve analyzer options by applying defaults
 */
export function resolveOptions(options: AnalyzerOptions): ResolvedOptions {
  return {
    timeRange: {
      ...{ days: DEFAULT_DAYS },
      ...options.timeRange,
    },
    mode: options.mode ?? DEFAULT_MODE,
    periodUnit: options.periodUnit ?? DEFAULT_PERIOD_UNIT,
    branch: options.branch,
  };
}
