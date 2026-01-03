/**
 * File ownership information
 */
export interface FileOwnership {
  /** File path */
  file: string;
  /** Primary owner (author with most changes) */
  owner: string;
  /** Ownership percentage (0-100) */
  share: number;
  /** Total lines changed by the owner */
  ownerLines: number;
  /** Total lines changed by all authors */
  totalLines: number;
  /** All authors who modified this file with their line counts */
  authors: Record<string, number>;
  /** Last commit date for this file */
  lastCommitDate?: Date;
}

/**
 * Directory ownership information
 */
export interface DirectoryOwnership {
  /** Directory path */
  directory: string;
  /** Primary owner (author with most files owned) */
  owner: string;
  /** Ownership percentage (0-100) based on files */
  share: number;
  /** Number of files owned by the primary owner */
  ownerFiles: number;
  /** Total number of files in the directory */
  totalFiles: number;
  /** Total lines changed in the directory */
  totalLines: number;
}

/**
 * Author ownership information
 */
export interface AuthorOwnership {
  /** Author name */
  author: string;
  /** List of files owned by this author */
  files: Array<{
    file: string;
    lines: number;
    share: number;
  }>;
  /** Total number of files owned */
  totalFiles: number;
  /** Total lines changed across all owned files */
  totalLines: number;
}

/**
 * Ownership analysis result
 */
export interface OwnershipAnalysisResult {
  /** File-level ownership map */
  files: Record<string, FileOwnership>;
  /** Directory-level ownership map */
  directories: Record<string, DirectoryOwnership>;
  /** Author-level ownership map */
  authors: Record<string, AuthorOwnership>;
}
