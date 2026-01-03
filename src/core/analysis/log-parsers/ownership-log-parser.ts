import type {
  AuthorOwnership,
  DirectoryOwnership,
  FileOwnership,
  OwnershipAnalysisResult,
} from '../../types/ownership.types';

/**
 * Parse ownership log output into ownership statistics
 * @param log - git log --numstat output with AUTHOR: prefix
 * @param authors - Optional author filter (case-insensitive)
 * @returns Ownership analysis result
 */
export function parseOwnershipStats(log: string, authors?: string[]): OwnershipAnalysisResult {
  // Map to track file -> author -> lines changed
  const fileAuthorLines: Record<string, Record<string, number>> = {};
  // Map to track file -> latest commit date
  const fileLastCommitDates: Record<string, Date> = {};
  const lines = log.split('\n');
  let currentAuthor = '';
  let currentCommitDate: Date | null = null;
  const authorFilter = authors?.map((a) => a.toLowerCase());

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0) {
      continue;
    }

    // Check if this is an author line with date
    if (trimmedLine.startsWith('AUTHOR:')) {
      const authorPart = trimmedLine.replace('AUTHOR:', '').trim();
      // Check if date is included (format: AUTHOR:name|DATE:date)
      if (authorPart.includes('|DATE:')) {
        const parts = authorPart.split('|DATE:');
        currentAuthor = parts[0].trim();
        const dateStr = parts[1]?.trim();
        if (dateStr) {
          // Parse ISO date format: 2024-01-15 10:30:45 +0900
          currentCommitDate = new Date(dateStr);
          // Validate date
          if (Number.isNaN(currentCommitDate.getTime())) {
            currentCommitDate = null;
          }
        } else {
          currentCommitDate = null;
        }
      } else {
        currentAuthor = authorPart;
        currentCommitDate = null;
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f771081e-8bc3-4743-9457-44201273bd79', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'ownership-log-parser.ts:30',
          message: 'Author line parsed',
          data: { currentAuthor, isEmpty: !currentAuthor, length: currentAuthor.length },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'B',
        }),
      }).catch(() => {});
      // #endregion

      // Apply author filter if specified
      if (authorFilter && !authorFilter.includes(currentAuthor.toLowerCase())) {
        currentAuthor = '';
      }
    } else if (trimmedLine.includes('\t') && currentAuthor) {
      // This is a numstat line: insertions\tdeletions\tfilepath
      const parts = trimmedLine.split('\t');
      if (parts.length >= 3) {
        const insertions = parseInt(parts[0], 10) || 0;
        const deletions = parseInt(parts[1], 10) || 0;
        let filePath = parts[2];

        if (!filePath) {
          continue;
        }

        // Normalize rename notation: {old => new} -> new
        const originalFilePath = filePath;
        filePath = normalizeRenameNotation(filePath);

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f771081e-8bc3-4743-9457-44201273bd79', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'ownership-log-parser.ts:42',
            message: 'File path parsed',
            data: {
              originalFilePath,
              normalizedFilePath: filePath,
              hasRenameNotation: originalFilePath.includes('{') && originalFilePath.includes('=>'),
              currentAuthor,
              isEmpty: !currentAuthor,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'A',
          }),
        }).catch(() => {});
        // #endregion

        // Skip if filePath becomes empty after normalization
        if (!filePath) {
          continue;
        }

        const linesChanged = insertions + deletions;

        // Initialize file entry if needed
        if (!fileAuthorLines[filePath]) {
          fileAuthorLines[filePath] = {};
        }

        // Add lines changed by this author
        fileAuthorLines[filePath][currentAuthor] =
          (fileAuthorLines[filePath][currentAuthor] || 0) + linesChanged;

        // Update last commit date for this file (keep the most recent date)
        if (currentCommitDate) {
          const existingDate = fileLastCommitDates[filePath];
          if (!existingDate || currentCommitDate > existingDate) {
            fileLastCommitDates[filePath] = currentCommitDate;
          }
        }
      }
    }
  }

  // Calculate file ownership
  const fileOwnership: Record<string, FileOwnership> = {};
  const directoryOwnership: Record<string, Record<string, number>> = {};
  const authorOwnership: Record<string, AuthorOwnership> = {};

  for (const [file, authorLines] of Object.entries(fileAuthorLines)) {
    // Calculate total lines for this file
    const totalLines = Object.values(authorLines).reduce((sum, lines) => sum + lines, 0);

    // Find primary owner (author with most lines)
    let primaryOwner = '';
    let maxLines = -1; // Start with -1 to handle 0 line changes
    for (const [author, lines] of Object.entries(authorLines)) {
      // Skip empty author names
      if (!author || author.trim() === '') {
        continue;
      }
      if (lines > maxLines) {
        maxLines = lines;
        primaryOwner = author;
      }
    }

    // Skip files with no valid owner
    if (!primaryOwner) {
      continue;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f771081e-8bc3-4743-9457-44201273bd79', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'ownership-log-parser.ts:77',
        message: 'Primary owner calculated',
        data: {
          file,
          primaryOwner,
          isEmpty: !primaryOwner,
          hasRenameNotation: file.includes('{ => }'),
          authorKeys: Object.keys(authorLines),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C',
      }),
    }).catch(() => {});
    // #endregion

    const share = totalLines > 0 ? Math.round((maxLines / totalLines) * 100) : 0;

    // Store file ownership
    fileOwnership[file] = {
      file,
      owner: primaryOwner,
      share,
      ownerLines: maxLines,
      totalLines,
      authors: { ...authorLines },
      lastCommitDate: fileLastCommitDates[file],
    };

    // Update directory ownership
    const directory = getDirectory(file);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f771081e-8bc3-4743-9457-44201273bd79', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'ownership-log-parser.ts:94',
        message: 'Directory extracted',
        data: { file, directory, hasRenameNotation: directory.includes('{ => }') },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'D',
      }),
    }).catch(() => {});
    // #endregion
    if (!directoryOwnership[directory]) {
      directoryOwnership[directory] = {};
    }
    directoryOwnership[directory][file] = maxLines;

    // Update author ownership
    if (!authorOwnership[primaryOwner]) {
      authorOwnership[primaryOwner] = {
        author: primaryOwner,
        files: [],
        totalFiles: 0,
        totalLines: 0,
      };
    }
    authorOwnership[primaryOwner].files.push({
      file,
      lines: maxLines,
      share,
    });
    authorOwnership[primaryOwner].totalFiles++;
    authorOwnership[primaryOwner].totalLines += maxLines;
  }

  // Calculate directory ownership
  const directoryResult: Record<string, DirectoryOwnership> = {};

  for (const [directory, files] of Object.entries(directoryOwnership)) {
    const fileList = Object.keys(files);
    const totalFiles = fileList.length;

    // Count files owned by each author
    const authorFileCounts: Record<string, number> = {};
    for (const file of fileList) {
      const ownership = fileOwnership[file];
      if (ownership) {
        authorFileCounts[ownership.owner] = (authorFileCounts[ownership.owner] || 0) + 1;
      }
    }

    // Find primary owner (author with most files)
    let primaryOwner = '';
    let maxFiles = 0;
    for (const [author, count] of Object.entries(authorFileCounts)) {
      // Skip empty author names
      if (!author || author.trim() === '') {
        continue;
      }
      if (count > maxFiles) {
        maxFiles = count;
        primaryOwner = author;
      }
    }

    // Skip directories with no valid owner
    if (!primaryOwner) {
      continue;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f771081e-8bc3-4743-9457-44201273bd79', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'ownership-log-parser.ts:140',
        message: 'Directory owner calculated',
        data: {
          directory,
          primaryOwner,
          isEmpty: !primaryOwner,
          hasRenameNotation: directory.includes('{ => }'),
          authorFileCounts,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'C',
      }),
    }).catch(() => {});
    // #endregion

    const share = totalFiles > 0 ? Math.round((maxFiles / totalFiles) * 100) : 0;
    const totalLines = fileList.reduce(
      (sum, file) => sum + (fileOwnership[file]?.totalLines || 0),
      0
    );

    directoryResult[directory] = {
      directory,
      owner: primaryOwner,
      share,
      ownerFiles: maxFiles,
      totalFiles,
      totalLines,
    };
  }

  // Sort author files by lines (descending)
  for (const author of Object.values(authorOwnership)) {
    author.files.sort((a, b) => b.lines - a.lines);
  }

  return {
    files: fileOwnership,
    directories: directoryResult,
    authors: authorOwnership,
  };
}

/**
 * Normalize Git rename notation in file paths
 * Converts "{old => new}" or "{ => new}" to "new"
 * @param filePath - File path that may contain rename notation
 * @returns Normalized file path
 */
function normalizeRenameNotation(filePath: string): string {
  // Match pattern: {old => new} or { => new} or {old => } or { => }
  // Handles cases like: "docs/{ => common}/file.md" -> "docs/common/file.md"
  // or "backend/src/adapter/llm_service/{ => langchain}/" -> "backend/src/adapter/llm_service/langchain/"
  const renamePattern = /\{[^}]*\s*=>\s*([^}]*)\}/g;
  let result = filePath;
  let hasEmptyRename = false;

  result = result.replace(renamePattern, (_match, newPath) => {
    // Use the new path after the arrow, or empty string if newPath is empty
    const normalized = newPath.trim();
    if (!normalized) {
      hasEmptyRename = true;
      return '';
    }
    return normalized;
  });

  // If rename resulted in empty path (e.g., "{old => }/file.ts" -> "/file.ts"),
  // check if the entire path should be considered empty
  if (hasEmptyRename && result.startsWith('/')) {
    // Check if this is a deletion case: {old => }/file.ts becomes /file.ts
    // In Git, {old => } means the file was deleted, so we should skip it
    // But if the path after normalization is just "/", it's invalid
    if (result === '/' || result.match(/^\/[^/]*$/)) {
      return '';
    }
  }

  return result;
}

/**
 * Get directory path from file path
 * @param filePath - Full file path
 * @returns Directory path (with trailing slash)
 */
function getDirectory(filePath: string): string {
  const lastSlashIndex = filePath.lastIndexOf('/');
  if (lastSlashIndex === -1) {
    return './';
  }
  return filePath.substring(0, lastSlashIndex + 1);
}
