import type { AnalyzerOptions } from '@/core';
import { DEFAULT_DAYS } from '@/core';
import { subcommandToMode } from '../commands';
import type { CLIOptions } from '../types';

/**
 * Adapt CLI options to analyzer options
 * @param options - Validated CLI options
 * @returns Analyzer options
 */
export function adaptToAnalyzerOptions(options: CLIOptions): AnalyzerOptions {
  // Determine mode and periodUnit from subcommand if specified
  const subcommandConfig = subcommandToMode[options.subcommand];
  const mode = subcommandConfig.mode;
  const periodUnit = subcommandConfig.periodUnit ?? options.periodUnit;

  const analyzerOptions: AnalyzerOptions = {
    timeRange: {},
    mode,
    periodUnit,
    branch: options.branch,
  };

  if (options.authors && options.authors.length > 0) {
    analyzerOptions.authors = options.authors;
  }

  if (options.since || options.until) {
    if (options.since) {
      analyzerOptions.timeRange!.since = options.since;
    }
    if (options.until) {
      analyzerOptions.timeRange!.until = options.until;
    }
  } else if (options.days) {
    analyzerOptions.timeRange!.days = options.days;
  } else {
    analyzerOptions.timeRange!.days = DEFAULT_DAYS;
  }

  if (options.minCommits !== undefined) {
    analyzerOptions.minCommits = options.minCommits;
  }

  // Ownership-specific options
  if (options.excludePatterns && options.excludePatterns.length > 0) {
    analyzerOptions.excludePatterns = options.excludePatterns;
  }

  if (options.respectGitignore !== undefined) {
    analyzerOptions.respectGitignore = options.respectGitignore;
  }

  if (options.directory) {
    analyzerOptions.directory = options.directory;
  }

  return analyzerOptions;
}
