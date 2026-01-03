/**
 * Classification thresholds
 */
export const THRESHOLDS = {
  /** Ratio of insertions to total changes to be classified as Explorer */
  EXPLORER_INSERTION_RATIO: 0.7,
  /** Ratio of deletions to total changes to be classified as Refactorer */
  REFACTORER_DELETION_RATIO: 0.4,
  /** Multiplier for average files touched to be classified as Generalist */
  GENERALIST_FILES_MULTIPLIER: 2.5,
  /** Minimum total changes required for meaningful classification */
  MIN_CHANGES_FOR_CLASSIFICATION: 100,
} as const;
