import type { ResolvedOptions } from '../../config';
import { buildLogQuery } from '../../config';
import type { GitClient } from '../../git';
import type { AggregateAnalysisResult } from '../../types';
import { parseAggregateStats, parseEfficiencyLog } from '../log-parsers';
import { analyzeAllEfficiency } from '../metrics';
import type { AnalysisMode } from './mode.interface';

/**
 * Mode for aggregate analysis
 */
export class AggregateMode implements AnalysisMode {
  async handle(
    options: ResolvedOptions,
    gitClient: GitClient,
    originalOptions: { authors?: string[] }
  ): Promise<AggregateAnalysisResult> {
    const { since, until, branch } = buildLogQuery(options);

    let aggregateLog = '';
    let efficiencyLog = '';

    try {
      [aggregateLog, efficiencyLog] = await Promise.all([
        gitClient.getAggregateLog(since, until, branch),
        gitClient.getStabilityLog(since, until, branch),
      ]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('does not have any commits')) {
        return {
          stats: {},
          efficiency: {},
        };
      }
      throw error;
    }

    const stats = parseAggregateStats(aggregateLog, originalOptions.authors);

    // Parse efficiency log and analyze
    const commits = parseEfficiencyLog(efficiencyLog);

    // Filter commits by authors if specified
    const authorFilter = originalOptions.authors?.map((a) => a.toLowerCase());
    const filteredCommits = authorFilter
      ? commits.filter((c) => authorFilter.includes(c.author.toLowerCase()))
      : commits;

    const efficiency = analyzeAllEfficiency(filteredCommits);

    return {
      stats,
      efficiency,
    };
  }
}
