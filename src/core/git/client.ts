import { type SimpleGit, simpleGit } from 'simple-git';
import type { GitClient } from './client.interface';

/**
 * Abstraction layer for Git commands.
 * Enables dependency injection for testing.
 */
export class GitClientImpl implements GitClient {
  private git: SimpleGit;

  constructor(git?: SimpleGit) {
    this.git = git ?? simpleGit();
  }

  async isRepository(): Promise<boolean> {
    return this.git.checkIsRepo();
  }

  /**
   * Get aggregate stats log (author name only)
   * Used for total contribution analysis
   */
  async getAggregateLog(since?: string, until?: string, branch?: string): Promise<string> {
    const args = ['log', '--numstat', '--pretty=format:%aN'];
    if (branch) args.push(branch);
    if (since) args.push(`--since=${since}`);
    if (until) args.push(`--until=${until}`);
    return this.git.raw(args);
  }

  /**
   * Get periodic stats log (author name with commit date)
   * Used for time-based grouped analysis
   */
  async getPeriodicLog(since?: string, until?: string, branch?: string): Promise<string> {
    const args = ['log', '--numstat', '--pretty=format:%aN|%cd', '--date=iso'];
    if (branch) args.push(branch);
    if (since) args.push(`--since=${since}`);
    if (until) args.push(`--until=${until}`);
    return this.git.raw(args);
  }

  /**
   * Get stability analysis log (author name with commit date and file changes)
   * Used for efficiency and churn rate analysis
   * Format: author|date followed by numstat lines
   */
  async getStabilityLog(since?: string, until?: string, branch?: string): Promise<string> {
    const args = ['log', '--numstat', '--pretty=format:%aN|%cd', '--date=iso', '--reverse'];
    if (branch) args.push(branch);
    if (since) args.push(`--since=${since}`);
    if (until) args.push(`--until=${until}`);
    return this.git.raw(args);
  }

  /**
   * Get file-author log with numstat (author name followed by file changes with line counts)
   * Used for ownership analysis
   * Format: AUTHOR:<name>|DATE:<date> followed by numstat lines (insertions\tdeletions\tfilepath)
   * The AUTHOR: prefix ensures author names are not confused with file paths
   */
  async getFileAuthorLog(
    since?: string,
    until?: string,
    branch?: string,
    directory?: string
  ): Promise<string> {
    const args = ['log', '--numstat', '--pretty=format:AUTHOR:%aN|DATE:%cd', '--date=iso'];
    if (branch) args.push(branch);
    if (since) {
      // Check if since is already in "X days ago" format
      if (since.includes('days ago') || since.includes('day ago')) {
        args.push(`--since=${since}`);
      } else {
        args.push(`--since=${since}`);
      }
    }
    if (until) {
      // Check if until is already in "X days ago" format
      if (until.includes('days ago') || until.includes('day ago')) {
        args.push(`--until=${until}`);
      } else {
        args.push(`--until=${until}`);
      }
    }
    // Add directory filter using -- separator
    if (directory) {
      args.push('--');
      args.push(directory);
    }
    return this.git.raw(args);
  }

  /**
   * Get commit-files log (commit hash followed by file paths)
   * Used for temporal coupling analysis (files changed together)
   * Format: COMMIT:<hash> followed by file paths (one per line)
   */
  async getCommitFilesLog(since?: string, until?: string, branch?: string): Promise<string> {
    const args = ['log', '--name-only', '--pretty=format:COMMIT:%H'];
    if (branch) args.push(branch);
    if (since) args.push(`--since=${since}`);
    if (until) args.push(`--until=${until}`);
    return this.git.raw(args);
  }
}
