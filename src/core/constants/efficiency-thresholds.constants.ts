/**
 * Efficiency thresholds for classification
 */
export const EFFICIENCY_THRESHOLDS = {
  /** Below this is considered "Micro Commits" */
  MICRO: 10,
  /** Good range lower bound */
  OPTIMAL_MIN: 30,
  /** Good range upper bound */
  OPTIMAL_MAX: 150,
  /** Above this is considered "Huge" */
  HUGE: 500,
} as const;
