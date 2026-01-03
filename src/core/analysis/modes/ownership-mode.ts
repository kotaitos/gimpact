import type { ResolvedOptions } from '../../config';
import { buildLogQuery } from '../../config';
import type { GitClient } from '../../git';
import type { OwnershipAnalysisResult } from '../../types/ownership.types';
import { parseOwnershipStats } from '../log-parsers/ownership-log-parser';
import type { AnalysisMode } from './mode.interface';

/**
 * Mode for ownership analysis
 */
export class OwnershipMode implements AnalysisMode {
  async handle(
    options: ResolvedOptions,
    gitClient: GitClient,
    originalOptions: { authors?: string[]; directory?: string }
  ): Promise<OwnershipAnalysisResult> {
    const { since, until, branch } = buildLogQuery(options);

    let fileAuthorLog = '';

    try {
      fileAuthorLog = await gitClient.getFileAuthorLog(
        since,
        until,
        branch,
        originalOptions.directory
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('does not have any commits')) {
        return {
          files: {},
          directories: {},
          authors: {},
        };
      }
      throw error;
    }

    const result = parseOwnershipStats(fileAuthorLog, originalOptions.authors);

    return result;
  }
}
