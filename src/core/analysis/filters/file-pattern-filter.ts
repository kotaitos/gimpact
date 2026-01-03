import { simpleGit } from 'simple-git';
import type { OwnershipAnalysisResult } from '../../types/ownership.types';

/**
 * Default patterns to exclude from ownership analysis
 * These are typically auto-generated or dependency files
 */
const DEFAULT_EXCLUDE_PATTERNS = [
  // Lock files
  '**/*.lock',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  '**/uv.lock',
  '**/Cargo.lock',
  '**/Gemfile.lock',
  '**/Pipfile.lock',
  '**/poetry.lock',
  '**/composer.lock',
  '**/go.sum',
  '**/go.mod',
  // Build outputs
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/.cache/**',
  '**/coverage/**',
  '**/.coverage/**',
  // Generated files
  '**/openapi.json',
  '**/openapi.yaml',
  '**/openapi.yml',
  '**/*.generated.*',
  '**/*.pb.go',
  '**/*.pb.ts',
  '**/*.pb.js',
  // IDE and editor files
  '**/.idea/**',
  '**/.vscode/**',
  '**/.DS_Store',
  '**/Thumbs.db',
  // Logs and temporary files
  '**/*.log',
  '**/*.tmp',
  '**/*.temp',
];

/**
 * Check if a file path matches any of the given patterns
 * Supports glob patterns with ** for recursive matching
 */
function matchesPattern(filePath: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (matchesGlob(filePath, pattern)) {
      return true;
    }
  }
  return false;
}

/**
 * Simple glob pattern matcher
 * Supports ** for recursive matching and * for single segment matching
 */
function matchesGlob(filePath: string, pattern: string): boolean {
  // Normalize paths: remove leading ./ if present
  const normalizedPath = filePath.replace(/^\.\//, '');
  let normalizedPattern = pattern.replace(/^\.\//, '');

  // Convert pattern to regex
  // Step 1: Replace ** with a unique placeholder (using characters that won't be escaped)
  // Use a placeholder that contains characters that are already escaped or won't conflict
  normalizedPattern = normalizedPattern.replace(/\*\*/g, '\0RECURSIVE\0');

  // Step 2: Escape special regex characters
  let regexPattern = normalizedPattern
    .replace(/[.+^$()|[\]\\]/g, '\\$&')
    // Replace * (single, not part of **) with [^/]* (matches any characters except /)
    .replace(/\*/g, '[^/]*')
    // Replace ? with . (matches any single character)
    .replace(/\?/g, '.');

  // Step 3: Replace placeholder with .*? (non-greedy) for **
  regexPattern = regexPattern.replace(/\0RECURSIVE\0/g, '.*?');

  // Step 4: If pattern doesn't start with / or **, allow matching from any position
  const originalPattern = pattern.replace(/^\.\//, '');
  if (!originalPattern.startsWith('/') && !originalPattern.startsWith('**')) {
    regexPattern = `.*?${regexPattern}`;
  }

  try {
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(normalizedPath);
  } catch (_error) {
    // If regex is invalid, return false (pattern doesn't match)
    return false;
  }
}

/**
 * Check if files are ignored by git (batch check)
 */
async function areGitIgnored(
  filePaths: string[],
  git: ReturnType<typeof simpleGit>
): Promise<Set<string>> {
  if (filePaths.length === 0) {
    return new Set();
  }

  try {
    // git check-ignore can check multiple files at once
    const result = await git.checkIgnore(filePaths);
    // result is an array of ignored file paths
    return new Set(result);
  } catch {
    // If checkIgnore fails, assume none are ignored
    return new Set();
  }
}

/**
 * Filter ownership results by file patterns
 */
export class FilePatternFilter {
  private excludePatterns: string[];
  private includeDirectory?: string;
  private respectGitignore: boolean;
  private repoRoot: string;
  private gitClient: ReturnType<typeof simpleGit> | null = null;

  constructor(
    excludePatterns: string[] = [],
    respectGitignore: boolean = true,
    repoRoot: string = process.cwd(),
    includeDirectory?: string
  ) {
    this.excludePatterns = [...DEFAULT_EXCLUDE_PATTERNS, ...excludePatterns];
    this.respectGitignore = respectGitignore;
    this.repoRoot = repoRoot;
    this.includeDirectory = includeDirectory;
  }

  /**
   * Get or create git client instance
   */
  private getGitClient(): ReturnType<typeof simpleGit> {
    if (!this.gitClient) {
      this.gitClient = simpleGit(this.repoRoot);
    }
    return this.gitClient;
  }

  /**
   * Check if a file should be excluded (pattern matching only, no git check)
   */
  private shouldExcludeByPattern(filePath: string): boolean {
    // First check if directory filter is specified
    if (this.includeDirectory) {
      // Normalize directory path: remove leading ./ and trailing /
      const normalizedDir = this.includeDirectory.replace(/^\.\//, '').replace(/\/$/, '');
      // Normalize file path: remove leading ./
      const normalizedPath = filePath.replace(/^\.\//, '');
      // Check if file is in the specified directory
      // File must start with "packages/" or be exactly "packages"
      const isInDirectory =
        normalizedPath === normalizedDir || normalizedPath.startsWith(`${normalizedDir}/`);
      if (!isInDirectory) {
        // File is not in the specified directory
        return true;
      }
    }

    // Then check exclude patterns
    return matchesPattern(filePath, this.excludePatterns);
  }

  /**
   * Filter ownership analysis result
   */
  async filter(result: OwnershipAnalysisResult): Promise<OwnershipAnalysisResult> {
    const filteredFiles: Record<string, (typeof result.files)[string]> = {};
    const filteredDirectories: Record<string, (typeof result.directories)[string]> = {};
    const filteredAuthors: Record<string, (typeof result.authors)[string]> = {};

    // First pass: filter by patterns (fast)
    const filesToCheckGitIgnore: string[] = [];
    const fileOwnershipMap = new Map<string, (typeof result.files)[string]>();

    for (const [filePath, fileOwnership] of Object.entries(result.files)) {
      if (this.shouldExcludeByPattern(filePath)) {
        // Excluded by pattern, skip
        continue;
      }

      if (this.respectGitignore) {
        // Need to check gitignore
        filesToCheckGitIgnore.push(filePath);
        fileOwnershipMap.set(filePath, fileOwnership);
      } else {
        // Not excluded, include it
        filteredFiles[filePath] = fileOwnership;
      }
    }

    // Second pass: batch check gitignore (much faster than individual checks)
    if (this.respectGitignore && filesToCheckGitIgnore.length > 0) {
      const gitClient = this.getGitClient();
      const ignoredFiles = await areGitIgnored(filesToCheckGitIgnore, gitClient);

      for (const filePath of filesToCheckGitIgnore) {
        if (!ignoredFiles.has(filePath)) {
          // Not ignored, include it
          const fileOwnership = fileOwnershipMap.get(filePath);
          if (fileOwnership) {
            filteredFiles[filePath] = fileOwnership;
          }
        }
      }
    }

    // Recalculate directory ownership based on filtered files
    const directoryFileCounts: Record<string, Record<string, number>> = {};

    for (const [filePath, fileOwnership] of Object.entries(filteredFiles)) {
      const directory = this.getDirectory(filePath);
      if (!directoryFileCounts[directory]) {
        directoryFileCounts[directory] = {};
      }

      const owner = fileOwnership.owner;
      directoryFileCounts[directory][owner] = (directoryFileCounts[directory][owner] || 0) + 1;
    }

    // Build filtered directory ownership
    for (const [directory, ownerCounts] of Object.entries(directoryFileCounts)) {
      // Filter directories by includeDirectory if specified
      if (this.includeDirectory) {
        const normalizedDir = this.includeDirectory.replace(/^\.\//, '').replace(/\/$/, '');
        const normalizedDirectory = directory.replace(/^\.\//, '').replace(/\/$/, '');
        // Exclude directories that are not within the specified directory
        if (
          !normalizedDirectory.startsWith(`${normalizedDir}/`) &&
          normalizedDirectory !== normalizedDir
        ) {
          continue;
        }
      }

      let primaryOwner = '';
      let maxFiles = 0;

      for (const [owner, count] of Object.entries(ownerCounts)) {
        if (count > maxFiles) {
          maxFiles = count;
          primaryOwner = owner;
        }
      }

      if (primaryOwner) {
        const totalFiles = Object.values(ownerCounts).reduce((sum, count) => sum + count, 0);
        const totalLines = Object.entries(filteredFiles)
          .filter(([path]) => this.getDirectory(path) === directory)
          .reduce((sum, [, ownership]) => sum + ownership.totalLines, 0);

        filteredDirectories[directory] = {
          directory,
          owner: primaryOwner,
          share: totalFiles > 0 ? Math.round((maxFiles / totalFiles) * 100) : 0,
          ownerFiles: maxFiles,
          totalFiles,
          totalLines,
        };
      }
    }

    // Recalculate author ownership based on filtered files
    for (const [filePath, fileOwnership] of Object.entries(filteredFiles)) {
      const owner = fileOwnership.owner;
      if (!filteredAuthors[owner]) {
        filteredAuthors[owner] = {
          author: owner,
          files: [],
          totalFiles: 0,
          totalLines: 0,
        };
      }

      filteredAuthors[owner].files.push({
        file: filePath,
        lines: fileOwnership.ownerLines,
        share: fileOwnership.share,
      });
      filteredAuthors[owner].totalFiles++;
      filteredAuthors[owner].totalLines += fileOwnership.ownerLines;
    }

    // Sort author files by lines (descending)
    for (const author of Object.values(filteredAuthors)) {
      author.files.sort((a, b) => b.lines - a.lines);
    }

    return {
      files: filteredFiles,
      directories: filteredDirectories,
      authors: filteredAuthors,
    };
  }

  private getDirectory(filePath: string): string {
    const lastSlashIndex = filePath.lastIndexOf('/');
    if (lastSlashIndex === -1) {
      return './';
    }
    return filePath.substring(0, lastSlashIndex + 1);
  }
}
