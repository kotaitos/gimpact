import { analyzeAllEfficiency } from './efficiency-metric';

/**
 * Metric registry for different analysis types
 */
export const metricRegistry = {
  efficiency: analyzeAllEfficiency,
} as const;
