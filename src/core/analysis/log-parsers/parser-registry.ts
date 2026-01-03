import { parseAggregateStats } from './aggregate-log-parser';
import { parseEfficiencyLog } from './efficiency-log-parser';
import { parsePeriodStats } from './period-log-parser';

/**
 * Parser registry for different log types
 */
export const parserRegistry = {
  aggregate: parseAggregateStats,
  period: parsePeriodStats,
  efficiency: parseEfficiencyLog,
} as const;
