import chalk from 'chalk';
import type { FileOwnership } from '@/core/types/ownership.types';

/**
 * Directory tree node structure
 */
export interface TreeNode {
  name: string;
  path: string;
  type: 'directory' | 'file';
  owner?: string;
  share?: number;
  files?: number;
  totalFiles?: number;
  lines?: number;
  children: TreeNode[];
  fileOwnership?: FileOwnership;
  /** Last commit date for this node (file or directory) */
  lastCommitDate?: Date;
}

/**
 * Build a directory tree from file ownership data
 */
export function buildDirectoryTree(files: Record<string, FileOwnership>): TreeNode {
  const root: TreeNode = {
    name: '.',
    path: '.',
    type: 'directory',
    children: [],
  };

  for (const [filePath, ownership] of Object.entries(files)) {
    const parts = filePath.split('/').filter((p) => p.length > 0);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      // Find or create node
      let node = current.children.find((child) => child.name === part);

      if (!node) {
        node = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'directory',
          children: [],
        };
        current.children.push(node);
      }

      // If it's a file, add ownership info
      if (isFile) {
        node.owner = ownership.owner;
        node.share = ownership.share;
        node.lines = ownership.totalLines;
        node.fileOwnership = ownership;
        node.lastCommitDate = ownership.lastCommitDate;
      }

      current = node;
    }
  }

  // Sort children: directories first, then files, both alphabetically
  function sortNode(node: TreeNode): void {
    node.children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    for (const child of node.children) {
      sortNode(child);
    }
  }

  sortNode(root);

  return root;
}

/**
 * Calculate directory statistics from tree
 */
export function calculateDirectoryStats(node: TreeNode): {
  totalFiles: number;
  totalLines: number;
  ownerCounts: Record<string, number>;
} {
  if (node.type === 'file') {
    const owner = node.owner || '';
    return {
      totalFiles: 1,
      totalLines: node.lines || 0,
      ownerCounts: owner ? { [owner]: 1 } : {},
    };
  }

  let totalFiles = 0;
  let totalLines = 0;
  const ownerCounts: Record<string, number> = {};
  let latestCommitDate: Date | undefined;

  for (const child of node.children) {
    const stats = calculateDirectoryStats(child);
    totalFiles += stats.totalFiles;
    totalLines += stats.totalLines;

    for (const [owner, count] of Object.entries(stats.ownerCounts)) {
      ownerCounts[owner] = (ownerCounts[owner] || 0) + count;
    }

    // Track latest commit date from children
    if (child.lastCommitDate) {
      if (!latestCommitDate || child.lastCommitDate > latestCommitDate) {
        latestCommitDate = child.lastCommitDate;
      }
    }
  }

  // Set directory owner (author with most files)
  let primaryOwner = '';
  let maxFiles = 0;
  for (const [owner, count] of Object.entries(ownerCounts)) {
    if (count > maxFiles) {
      maxFiles = count;
      primaryOwner = owner;
    }
  }

  node.owner = primaryOwner;
  node.share = totalFiles > 0 ? Math.round((maxFiles / totalFiles) * 100) : 0;
  node.files = maxFiles;
  node.totalFiles = totalFiles;
  node.lines = totalLines;
  node.lastCommitDate = latestCommitDate;

  return { totalFiles, totalLines, ownerCounts };
}

/**
 * Print directory tree
 */
export function printDirectoryTree(
  root: TreeNode,
  options: {
    verbose?: boolean;
    maxDepth?: number;
    showFiles?: boolean;
  } = {}
): void {
  const { verbose = false, maxDepth = Infinity, showFiles = true } = options;

  // Calculate directory stats
  calculateDirectoryStats(root);

  // Print tree recursively
  function printNode(node: TreeNode, prefix: string, isLast: boolean, depth: number): void {
    if (depth > maxDepth) {
      return;
    }

    // Skip root node
    if (node.path !== '.') {
      const connector = isLast ? '└── ' : '├── ';
      const name = node.type === 'directory' ? chalk.cyan(`${node.name}/`) : node.name;

      let line = prefix + connector + name;

      if (node.type === 'directory') {
        // Directory info
        if (node.owner && node.totalFiles !== undefined) {
          line += chalk.dim(
            ` [${node.owner} | ${node.files}/${node.totalFiles} files | ${node.share}% | ${node.lines?.toLocaleString()} lines]`
          );
        }
      } else if (node.type === 'file' && verbose) {
        // File info (only in verbose mode)
        if (node.owner) {
          line += chalk.dim(
            ` [${node.owner} | ${node.share}% | ${node.lines?.toLocaleString()} lines]`
          );
        }
      }

      console.log(line);
    }

    // Print children
    if (node.type === 'directory' && node.children.length > 0) {
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      const visibleChildren = showFiles
        ? node.children
        : node.children.filter((child) => child.type === 'directory');

      for (let i = 0; i < visibleChildren.length; i++) {
        const child = visibleChildren[i];
        const isLastChild = i === visibleChildren.length - 1;
        printNode(child, childPrefix, isLastChild, depth + 1);
      }

      // Show file count if files are hidden
      if (!showFiles && node.children.some((child) => child.type === 'file')) {
        const fileCount = node.children.filter((child) => child.type === 'file').length;
        console.log(
          childPrefix + chalk.dim(`└── ... ${fileCount} file${fileCount !== 1 ? 's' : ''}`)
        );
      }
    }
  }

  printNode(root, '', true, 0);
}

/**
 * Format directory tree for ownership display
 */
export function formatDirectoryTreeForOwnership(
  files: Record<string, FileOwnership>,
  options: {
    verbose?: boolean;
    maxDepth?: number;
    showFiles?: boolean;
  } = {}
): void {
  const tree = buildDirectoryTree(files);
  printDirectoryTree(tree, options);
}
