/**
 * Utility functions for formatting file paths in output
 */

/**
 * Find the longest common prefix among an array of paths
 */
export function findCommonPrefix(paths: string[]): string {
  if (paths.length === 0) {
    return '';
  }

  if (paths.length === 1) {
    const lastSlash = paths[0].lastIndexOf('/');
    return lastSlash >= 0 ? paths[0].substring(0, lastSlash + 1) : '';
  }

  // Find the shortest path to use as reference
  const shortestPath = paths.reduce((a, b) => (a.length < b.length ? a : b));
  let commonPrefix = '';

  // Check each character position
  for (let i = 0; i <= shortestPath.length; i++) {
    const prefix = shortestPath.substring(0, i);
    const allMatch = paths.every((path) => path.startsWith(prefix));

    if (allMatch) {
      // Only update if we're at a directory boundary (ends with /)
      if (i === shortestPath.length || shortestPath[i] === '/') {
        commonPrefix = prefix;
      }
    } else {
      break;
    }
  }

  return commonPrefix;
}

/**
 * Remove common prefix from paths
 */
export function removeCommonPrefix(paths: string[], commonPrefix: string): string[] {
  if (!commonPrefix) {
    return paths;
  }

  return paths.map((path) => {
    if (path.startsWith(commonPrefix)) {
      return path.substring(commonPrefix.length);
    }
    return path;
  });
}

/**
 * Smart truncate a path to fit within maxLength
 * Preserves important parts: directory name and filename
 * Example: "very/long/path/to/important/file.ts" -> ".../important/file.ts"
 */
export function smartTruncatePath(path: string, maxLength: number): string {
  if (path.length <= maxLength) {
    return path;
  }

  const parts = path.split('/');
  const filename = parts[parts.length - 1];
  const directoryName = parts[parts.length - 2] || '';

  // Calculate space needed for filename and directory
  const neededLength = directoryName.length + 1 + filename.length + 3; // +3 for ".../"

  if (neededLength > maxLength) {
    // If even the important parts are too long, just truncate the filename
    if (filename.length > maxLength - 4) {
      return `...${filename.substring(filename.length - (maxLength - 4))}`;
    }
    return `.../${filename}`;
  }

  // Try to include as much of the path as possible
  let result = `.../${directoryName}/${filename}`;
  let remainingLength = maxLength - result.length;

  // Add more path segments from the end if space allows
  for (let i = parts.length - 3; i >= 0 && remainingLength > 0; i--) {
    const segment = parts[i];
    if (segment.length + 1 <= remainingLength) {
      result = `.../${segment}${result.substring(3)}`; // Replace "..." with ".../segment"
      remainingLength -= segment.length + 1;
    } else {
      break;
    }
  }

  return result;
}

/**
 * Format paths for table display
 * - Removes common prefix and shows it separately
 * - Applies smart truncation if needed
 */
export function formatPathsForDisplay(
  paths: string[],
  options: {
    maxLength?: number;
    showCommonPrefix?: boolean;
  } = {}
): {
  commonPrefix: string;
  formattedPaths: string[];
} {
  const { maxLength = 60, showCommonPrefix = true } = options;

  if (paths.length === 0) {
    return { commonPrefix: '', formattedPaths: [] };
  }

  // Find and remove common prefix
  const commonPrefix = showCommonPrefix ? findCommonPrefix(paths) : '';
  let formattedPaths = removeCommonPrefix(paths, commonPrefix);

  // Apply smart truncation if maxLength is specified
  if (maxLength > 0) {
    formattedPaths = formattedPaths.map((path) => smartTruncatePath(path, maxLength));
  }

  return { commonPrefix, formattedPaths };
}
