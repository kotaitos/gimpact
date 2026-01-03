import type { AuthorStats, AuthorStatsMap } from '../../types';
import { THRESHOLDS } from './constants';
import type { ContributorType, ContributorTypeInfo } from './types';

/**
 * Mapping of contributor types to display information
 */
const CONTRIBUTOR_TYPE_INFO: Record<ContributorType, ContributorTypeInfo> = {
  Scout: { type: 'Scout', emoji: '✨', label: '✨ Scout' },
  Generalist: { type: 'Generalist', emoji: '👤', label: '👤 Generalist' },
  Refactorer: { type: 'Refactorer', emoji: '🛠', label: '🛠 Refactorer' },
  Explorer: { type: 'Explorer', emoji: '🚀', label: '🚀 Explorer' },
  Artisan: { type: 'Artisan', emoji: '💎', label: '💎 Artisan' },
};

/**
 * Classify a single contributor based on their stats
 * @param stats - The contributor's statistics
 * @param avgFilesTouched - Average files touched across all contributors (for Generalist classification)
 * @returns The contributor type
 */
export function classifyContributor(stats: AuthorStats, avgFilesTouched: number): ContributorType {
  const totalChanges = stats.insertions + stats.deletions;

  // Scout: quick, small contributions (total delta < 100)
  if (totalChanges < THRESHOLDS.MIN_CHANGES_FOR_CLASSIFICATION) {
    return 'Scout';
  }

  const insertionRatio = stats.insertions / totalChanges;
  const deletionRatio = stats.deletions / totalChanges;

  // Refactorer: significant deletions (>=40% of changes are deletions)
  if (deletionRatio >= THRESHOLDS.REFACTORER_DELETION_RATIO) {
    return 'Refactorer';
  }

  // Explorer: primarily adding new code (>70% insertions)
  if (insertionRatio > THRESHOLDS.EXPLORER_INSERTION_RATIO) {
    return 'Explorer';
  }

  // Generalist: touches significantly more files than average (2.5x)
  if (stats.filesTouched > avgFilesTouched * THRESHOLDS.GENERALIST_FILES_MULTIPLIER) {
    return 'Generalist';
  }

  // Artisan: balanced changes, reliable and steady work
  return 'Artisan';
}

/**
 * Calculate average files touched across all contributors
 * @param statsMap - Map of author stats
 * @returns Average files touched
 */
export function calculateAverageFilesTouched(statsMap: AuthorStatsMap): number {
  const authors = Object.keys(statsMap);
  if (authors.length === 0) {
    return 0;
  }

  const totalFiles = authors.reduce((sum, author) => sum + statsMap[author].filesTouched, 0);
  return totalFiles / authors.length;
}

/**
 * Get display information for a contributor type
 * @param type - The contributor type
 * @returns Display information including emoji and label
 */
export function getContributorTypeInfo(type: ContributorType): ContributorTypeInfo {
  return CONTRIBUTOR_TYPE_INFO[type];
}

/**
 * Classify all contributors in a stats map
 * @param statsMap - Map of author stats
 * @returns Map of author names to their contributor types
 */
export function classifyAllContributors(statsMap: AuthorStatsMap): Record<string, ContributorType> {
  const avgFilesTouched = calculateAverageFilesTouched(statsMap);
  const result: Record<string, ContributorType> = {};

  for (const [author, stats] of Object.entries(statsMap)) {
    result[author] = classifyContributor(stats, avgFilesTouched);
  }

  return result;
}
