/**
 * Parser interface for parsing git log output
 */
export interface Parser<T> {
  parse(log: string, ...args: unknown[]): T;
}
