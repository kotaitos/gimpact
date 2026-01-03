/**
 * Metric interface for analyzing commit data
 */
export interface Metric<TInput, TOutput> {
  analyze(input: TInput): TOutput;
}
