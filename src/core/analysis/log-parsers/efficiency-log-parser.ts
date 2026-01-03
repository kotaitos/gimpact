/**
 * Commit data with date and files for efficiency analysis
 */
export interface CommitData {
  author: string;
  date: Date;
  insertions: number;
  deletions: number;
  files: string[];
}

/**
 * Parse efficiency log output into commit data
 * @param log - git log output with format: author|date followed by numstat lines
 * @returns Array of commit data
 */
export function parseEfficiencyLog(log: string): CommitData[] {
  const commits: CommitData[] = [];
  const lines = log.split('\n');

  let currentCommit: CommitData | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0) {
      continue;
    }

    // Check if this is a commit header line (contains |)
    if (trimmedLine.includes('|') && !trimmedLine.includes('\t')) {
      // Save previous commit if exists
      if (currentCommit) {
        commits.push(currentCommit);
      }

      const parts = trimmedLine.split('|');
      if (parts.length >= 2) {
        currentCommit = {
          author: parts[0],
          date: new Date(parts[1]),
          insertions: 0,
          deletions: 0,
          files: [],
        };
      }
    } else if (trimmedLine.includes('\t') && currentCommit) {
      // This is a file change line
      const parts = trimmedLine.split('\t');
      const insertions = parseInt(parts[0], 10) || 0;
      const deletions = parseInt(parts[1], 10) || 0;
      const filePath = parts[2];

      currentCommit.insertions += insertions;
      currentCommit.deletions += deletions;
      if (filePath) {
        currentCommit.files.push(filePath);
      }
    }
  }

  // Don't forget the last commit
  if (currentCommit) {
    commits.push(currentCommit);
  }

  return commits;
}
