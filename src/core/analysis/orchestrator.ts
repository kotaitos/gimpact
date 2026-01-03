import { resolveOptions } from '../config';
import type { GitClient } from '../git';
import { createGitClient } from '../git';
import type {
  AggregateAnalysisResult,
  AnalyzerOptions,
  OwnershipAnalysisResult,
  PeriodAuthorStatsArray,
} from '../types';
import { FilePatternFilter, FilterChain, MinCommitsFilter } from './filters';
import { modeRegistry } from './modes';

/**
 * Analyze git repository contribution statistics
 * @param options - Analysis configuration
 * @param gitClient - Optional GitClient for dependency injection
 * @throws {Error} If not a git repository
 */
export async function analyzeContributions(
  options: AnalyzerOptions = {},
  gitClient?: GitClient
): Promise<AggregateAnalysisResult | PeriodAuthorStatsArray | OwnershipAnalysisResult> {
  const client = gitClient ?? createGitClient();

  const isRepo = await client.isRepository();
  if (!isRepo) {
    throw new Error('Not a git repository. Please run this command in a git repository.');
  }

  const resolvedOpts = resolveOptions(options);
  const mode = modeRegistry.get(resolvedOpts.mode);

  if (!mode) {
    throw new Error(`Unknown analysis mode: ${resolvedOpts.mode}`);
  }

  // Execute mode
  let result = await mode.handle(resolvedOpts, client, {
    authors: options.authors,
    directory: options.directory,
  });

  // Apply filters
  if (resolvedOpts.mode === 'ownership') {
    // Apply file pattern filter for ownership mode
    // Note: directory filtering is already applied at Git log level, so we don't pass it here
    // to avoid double filtering
    const filePatternFilter = new FilePatternFilter(
      options.excludePatterns,
      options.respectGitignore !== false, // default to true
      process.cwd(),
      undefined // Don't filter by directory here since it's already filtered at Git log level
    );
    result = await filePatternFilter.filter(result as OwnershipAnalysisResult);
  } else {
    const filterChain = new FilterChain();

    // Apply minCommits filter if specified
    if (options.minCommits !== undefined && options.minCommits > 1) {
      filterChain.addFilter(new MinCommitsFilter(options.minCommits));
    }

    // Note: Author filter is already applied in parsers, but we can add it here for consistency
    // if needed in the future

    if (!filterChain.isEmpty()) {
      result = filterChain.apply(result as AggregateAnalysisResult | PeriodAuthorStatsArray);
    }
  }

  return result;
}
