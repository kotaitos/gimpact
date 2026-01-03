import type { ResolvedOptions } from '../../config';
import { buildLogQuery } from '../../config';
import type { GitClient } from '../../git';
import type { PeriodAuthorStatsArray } from '../../types';
import { parsePeriodStats } from '../log-parsers';
import type { AnalysisMode } from './mode.interface';

/**
 * Mode for periodic analysis
 */
export class PeriodicMode implements AnalysisMode {
  async handle(
    options: ResolvedOptions,
    gitClient: GitClient,
    originalOptions: { authors?: string[] }
  ): Promise<PeriodAuthorStatsArray> {
    const { since, until, branch } = buildLogQuery(options);

    let log = '';
    try {
      log = await gitClient.getPeriodicLog(since, until, branch);
    } catch (error) {
      if (error instanceof Error && error.message.includes('does not have any commits')) {
        return [];
      }
      throw error;
    }

    return parsePeriodStats(log, options.periodUnit, originalOptions.authors);
  }
}
