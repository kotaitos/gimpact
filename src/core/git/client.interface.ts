/**
 * Git client interface for analysis operations
 * Defines only the methods used by the analysis module
 */
export interface GitClient {
  isRepository(): Promise<boolean>;
  getAggregateLog(since?: string, until?: string, branch?: string): Promise<string>;
  getPeriodicLog(since?: string, until?: string, branch?: string): Promise<string>;
  getStabilityLog(since?: string, until?: string, branch?: string): Promise<string>;
  getFileAuthorLog(
    since?: string,
    until?: string,
    branch?: string,
    directory?: string
  ): Promise<string>;
}
