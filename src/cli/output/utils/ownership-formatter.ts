import chalk from 'chalk';
import type { FileOwnership } from '@/core/types/ownership.types';
import type { TreeNode } from './tree-formatter';
import { buildDirectoryTree, calculateDirectoryStats } from './tree-formatter';

/**
 * Format number with k suffix for thousands
 */
function formatNumber(num: number): string {
  if (num >= 1000) {
    const k = num / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return num.toString();
}

/**
 * Get density indicator based on ownership percentage
 */
function getDensityIndicator(share: number): string {
  if (share > 80) {
    return '█'; // Solo
  }
  if (share > 50) {
    return '▓'; // Focused
  }
  return '░'; // Distributed
}

/**
 * Calculate column widths based on terminal width
 */
function calculateColumnWidths(terminalWidth: number): {
  pathWidth: number;
  ownerWidth: number;
  shareWidth: number;
  linesWidth: number;
} {
  const minTerminalWidth = 80;
  const effectiveWidth = Math.max(terminalWidth || minTerminalWidth, minTerminalWidth);

  // Reserve space for tree connectors (max 4 chars per level, assume 3 levels = 12 chars)
  const treeConnectorSpace = 12;
  const pathWidth = Math.min(40, Math.floor((effectiveWidth - treeConnectorSpace) * 0.4));
  const ownerWidth = 20;
  const shareWidth = 6; // "100%"
  const linesWidth = 8; // "1.6k"

  return {
    pathWidth,
    ownerWidth,
    shareWidth,
    linesWidth,
  };
}

/**
 * Strip ANSI escape codes from a string
 */
function stripAnsi(str: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape sequences are needed for terminal color support
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Format a string to fixed width with right alignment for numbers
 */
function padRight(str: string, width: number): string {
  const visibleLength = stripAnsi(str).length;
  const padding = Math.max(0, width - visibleLength);
  return str + ' '.repeat(padding);
}

/**
 * Format a number string to fixed width with right alignment
 */
function padLeft(str: string, width: number): string {
  const visibleLength = stripAnsi(str).length;
  const padding = Math.max(0, width - visibleLength);
  return ' '.repeat(padding) + str;
}

/**
 * Check if a path is a test or snapshot path
 */
function isTestOrSnapshotPath(path: string): boolean {
  const lowerPath = path.toLowerCase();
  return (
    lowerPath.includes('__snapshots__') ||
    lowerPath.includes('.snap') ||
    lowerPath.includes('.test.') ||
    lowerPath.includes('.spec.') ||
    lowerPath.includes('__tests__') ||
    lowerPath.includes('__test__') ||
    lowerPath.includes('/test/') ||
    lowerPath.includes('/tests/') ||
    lowerPath.includes('/spec/') ||
    lowerPath.includes('/specs/')
  );
}

/**
 * Check if a folder should be collapsed (trivial folder)
 */
function shouldCollapseTrivialFolder(node: TreeNode): boolean {
  return (node.lines || 0) < 100;
}

/**
 * Flatten single-child paths in the tree
 */
function flattenSingleChildPaths(node: TreeNode): TreeNode {
  const flattened: TreeNode = {
    ...node,
    children: [],
  };

  for (const child of node.children) {
    if (child.type === 'directory' && child.children.length === 1) {
      // This directory has only one child, flatten it
      const singleChild = child.children[0];
      if (singleChild.type === 'directory') {
        // Create a new node with combined path
        const flattenedChild = flattenSingleChildPaths(singleChild);
        // Combine names but keep the actual path from the child
        flattenedChild.name = `${child.name}/${singleChild.name}`;
        flattenedChild.path = singleChild.path; // Keep the actual path
        // Preserve statistics from the child (which has the actual data)
        // The parent's stats are already calculated, so we use the child's stats
        flattened.children.push(flattenedChild);
        continue;
      }
    }
    // Recursively flatten children
    const processedChild = flattenSingleChildPaths(child);
    flattened.children.push(processedChild);
  }

  return flattened;
}

/**
 * Collect all knowledge concentration areas (100% ownership, >= 500 lines)
 */
function calculateKnowledgeConcentrationAreas(
  node: TreeNode,
  concentrationAreas: Array<{ path: string; owner: string; share: number; lines: number }>,
  directory?: string
): void {
  if (node.type === 'directory' && node.owner && node.share === 100 && (node.lines || 0) >= 500) {
    // Check directory filter
    if (directory) {
      const normalizedDir = directory.replace(/^\.\//, '').replace(/\/$/, '');
      const normalizedPath = node.path.replace(/^\.\//, '');
      if (
        normalizedPath !== normalizedDir &&
        !normalizedPath.startsWith(`${normalizedDir}/`) &&
        !normalizedDir.startsWith(`${normalizedPath}/`)
      ) {
        // Skip if not in filter
      } else {
        concentrationAreas.push({
          path: node.path,
          owner: node.owner,
          share: node.share,
          lines: node.lines || 0,
        });
      }
    } else {
      concentrationAreas.push({
        path: node.path,
        owner: node.owner,
        share: node.share,
        lines: node.lines || 0,
      });
    }
  }

  // Recursively check children
  for (const child of node.children) {
    if (child.type === 'directory') {
      calculateKnowledgeConcentrationAreas(child, concentrationAreas, directory);
    }
  }
}

/**
 * Format relative time (e.g., "2d ago", "1w ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'today';
  }
  if (diffDays === 1) {
    return '1d ago';
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}w ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months}mo ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years}y ago`;
}

/**
 * Print knowledge concentration section
 */
function printKnowledgeConcentration(
  tree: TreeNode,
  columnWidths: ReturnType<typeof calculateColumnWidths>,
  directory?: string
): void {
  const concentrationAreas: Array<{ path: string; owner: string; share: number; lines: number }> =
    [];
  calculateKnowledgeConcentrationAreas(tree, concentrationAreas, directory);

  if (concentrationAreas.length === 0) {
    return;
  }

  // Sort by lines descending
  concentrationAreas.sort((a, b) => b.lines - a.lines);

  // Take top 3
  const topConcentrations = concentrationAreas.slice(0, 3);

  console.log(chalk.bold.cyan('📊 Top Knowledge Concentration (Density)'));
  for (let i = 0; i < topConcentrations.length; i++) {
    const concentration = topConcentrations[i];
    const displayPath = concentration.path.replace(/^\.\//, '');
    // Truncate path if too long
    const maxPathWidth = columnWidths.pathWidth - 5; // Reserve space for "📂 " and padding
    const truncatedPath =
      displayPath.length > maxPathWidth
        ? `${displayPath.slice(0, maxPathWidth - 3)}...`
        : displayPath;
    const pathDisplay = padRight(`📂 ${truncatedPath}`, columnWidths.pathWidth);
    const ownerDisplay = padRight(chalk.bold(concentration.owner), columnWidths.ownerWidth);
    const shareDisplay = padLeft(`${concentration.share}%`, columnWidths.shareWidth);
    const linesDisplay = padLeft(formatNumber(concentration.lines), columnWidths.linesWidth);

    console.log(
      `  ${i + 1}. ${pathDisplay} ${chalk.red.bold('█')} ${ownerDisplay} ${chalk.dim(`[${shareDisplay} / ${linesDisplay} lines]`)}`
    );
  }
  console.log('');
}

/**
 * Print header row
 */
function printHeader(columnWidths: ReturnType<typeof calculateColumnWidths>): void {
  const pathHeader = padRight('DIRECTORY / FOLDER', columnWidths.pathWidth);
  const ownerHeader = padRight('OWNER', columnWidths.ownerWidth);
  const shareHeader = padRight('SHARE', columnWidths.shareWidth);
  const linesHeader = padRight('LINES', columnWidths.linesWidth);

  console.log(`${pathHeader} ${ownerHeader} ${shareHeader} ${linesHeader}`);
  const separator = '─'.repeat(
    columnWidths.pathWidth +
      columnWidths.ownerWidth +
      columnWidths.shareWidth +
      columnWidths.linesWidth +
      3
  );
  console.log(chalk.dim(`───┬${separator}`));
}

/**
 * Format directory name with proper truncation
 */
function formatDirectoryName(name: string, maxWidth: number): string {
  const displayName = name.startsWith('.') ? name : name;
  const fullName = `📂 ${displayName}/`;
  const visibleLength = stripAnsi(fullName).length;

  if (visibleLength <= maxWidth) {
    return fullName;
  }

  // Truncate with ellipsis
  const truncated = `${fullName.slice(0, maxWidth - 3)}...`;
  return truncated;
}

/**
 * Print ownership tree in new format
 */
export function printOwnershipTree(
  files: Record<string, FileOwnership>,
  options: {
    maxDepth?: number;
    directory?: string;
  } = {}
): void {
  const { maxDepth = Infinity, directory } = options;

  const tree = buildDirectoryTree(files);
  calculateDirectoryStats(tree);

  // Flatten single-child paths
  const flattenedTree = flattenSingleChildPaths(tree);
  calculateDirectoryStats(flattenedTree);

  // Get terminal width
  const terminalWidth = process.stdout.columns || 80;
  const columnWidths = calculateColumnWidths(terminalWidth);

  console.log(chalk.bold.cyan('📁 Logic Distribution (Knowledge base)'));
  console.log(
    chalk.dim('   Density: ') +
      chalk.red.bold('█ Solo (>80%)') +
      chalk.dim(' | ') +
      chalk.yellow.bold('▓ Focused (>50%)') +
      chalk.dim(' | ') +
      chalk.green.bold('░ Distributed')
  );
  console.log('');

  // Print knowledge concentration
  printKnowledgeConcentration(flattenedTree, columnWidths, directory);

  // Print header
  printHeader(columnWidths);

  function printNode(
    node: TreeNode,
    prefix: string,
    isLast: boolean,
    depth: number,
    isRoot: boolean = false
  ): void {
    if (depth > maxDepth) {
      return;
    }

    // Skip root node
    if (isRoot) {
      // Print children of root
      let children = node.children.filter((child) => child.type === 'directory');

      // If directory filter is specified, only show directories that are part of the filter path
      if (directory) {
        const normalizedDir = directory.replace(/^\.\//, '').replace(/\/$/, '');
        const dirParts = normalizedDir.split('/');
        const firstDirPart = dirParts[0];

        children = children.filter((child) => {
          const normalizedPath = child.path.replace(/^\.\//, '');
          return normalizedPath === firstDirPart || normalizedPath.startsWith(`${firstDirPart}/`);
        });
      }

      // Group consecutive trivial folders
      const processedChildren: TreeNode[] = [];
      let trivialGroup: TreeNode[] = [];

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const isTrivial = shouldCollapseTrivialFolder(child);

        if (isTrivial) {
          trivialGroup.push(child);
        } else {
          // Print accumulated trivial folders if any
          if (trivialGroup.length > 0) {
            const trivialPrefix = '';
            console.log(
              trivialPrefix +
                chalk.dim(
                  `└── [+ ${trivialGroup.length} minor folder${trivialGroup.length !== 1 ? 's' : ''}]`
                )
            );
            trivialGroup = [];
          }
          processedChildren.push(child);
        }
      }

      // Print remaining trivial folders
      if (trivialGroup.length > 0) {
        console.log(
          chalk.dim(
            `└── [+ ${trivialGroup.length} minor folder${trivialGroup.length !== 1 ? 's' : ''}]`
          )
        );
      }

      // Print non-trivial children
      for (let i = 0; i < processedChildren.length; i++) {
        const child = processedChildren[i];
        const isLastChild = i === processedChildren.length - 1;
        printNode(child, '', isLastChild, depth + 1, false);
      }
      return;
    }

    if (node.type === 'directory') {
      // Check if this directory should be shown based on the filter
      if (directory) {
        const normalizedDir = directory.replace(/^\.\//, '').replace(/\/$/, '');
        const normalizedPath = node.path.replace(/^\.\//, '');
        if (
          normalizedPath !== normalizedDir &&
          !normalizedPath.startsWith(`${normalizedDir}/`) &&
          !normalizedDir.startsWith(`${normalizedPath}/`)
        ) {
          return;
        }
      }

      // Check if this is a trivial folder
      const isTrivial = shouldCollapseTrivialFolder(node);

      if (!isTrivial) {
        // Print this directory
        if (node.owner && node.share !== undefined && node.lines !== undefined) {
          const densityIndicator = getDensityIndicator(node.share);
          const displayName = formatDirectoryName(
            node.name,
            columnWidths.pathWidth - prefix.length - 4
          );
          const pathDisplay = padRight(
            prefix + (isLast ? '└── ' : '├── ') + displayName,
            columnWidths.pathWidth
          );

          // Apply gray color for test/snapshot paths when directory filter is active
          let ownerDisplay = padRight(chalk.bold(node.owner), columnWidths.ownerWidth);
          let shareDisplay = padLeft(`${node.share}%`, columnWidths.shareWidth);
          let linesDisplay = padLeft(formatNumber(node.lines), columnWidths.linesWidth);

          // Format last commit date if available
          let dateDisplay = '';
          if (node.lastCommitDate) {
            const relativeTime = formatRelativeTime(node.lastCommitDate);
            dateDisplay = ` / ${relativeTime}`;
          }

          if (directory && isTestOrSnapshotPath(node.path)) {
            ownerDisplay = padRight(chalk.gray(node.owner), columnWidths.ownerWidth);
            shareDisplay = padLeft(chalk.gray(`${node.share}%`), columnWidths.shareWidth);
            linesDisplay = padLeft(chalk.gray(formatNumber(node.lines)), columnWidths.linesWidth);
            const grayPathDisplay = padRight(
              chalk.gray(prefix + (isLast ? '└── ' : '├── ') + displayName),
              columnWidths.pathWidth
            );
            console.log(
              `${grayPathDisplay} ${ownerDisplay} ${shareDisplay} ${linesDisplay}${chalk.gray(dateDisplay)}`
            );
          } else {
            // Apply color to density indicator based on share
            let coloredIndicator = densityIndicator;
            if (node.share > 80) {
              coloredIndicator = chalk.red.bold(densityIndicator);
            } else if (node.share > 50) {
              coloredIndicator = chalk.yellow.bold(densityIndicator);
            } else {
              coloredIndicator = chalk.green.bold(densityIndicator);
            }
            console.log(
              `${pathDisplay} ${coloredIndicator} ${ownerDisplay} ${shareDisplay} ${linesDisplay}${chalk.dim(dateDisplay)}`
            );
          }
        }

        // Print children
        if (node.children.length > 0) {
          const childPrefix = prefix + (isLast ? '    ' : '│   ');
          let visibleChildren = node.children.filter((child) => child.type === 'directory');

          // Filter children based on directory filter
          if (directory) {
            const normalizedDir = directory.replace(/^\.\//, '').replace(/\/$/, '');
            visibleChildren = visibleChildren.filter((child) => {
              const normalizedPath = child.path.replace(/^\.\//, '');
              return (
                normalizedPath === normalizedDir ||
                normalizedPath.startsWith(`${normalizedDir}/`) ||
                normalizedDir.startsWith(`${normalizedPath}/`)
              );
            });
          }

          // Group consecutive trivial folders
          const processedChildren: TreeNode[] = [];
          let trivialGroup: TreeNode[] = [];

          for (let i = 0; i < visibleChildren.length; i++) {
            const child = visibleChildren[i];
            const isTrivialChild = shouldCollapseTrivialFolder(child);

            if (isTrivialChild) {
              trivialGroup.push(child);
            } else {
              // Print accumulated trivial folders if any
              if (trivialGroup.length > 0) {
                console.log(
                  childPrefix +
                    chalk.dim(
                      `└── [+ ${trivialGroup.length} minor folder${trivialGroup.length !== 1 ? 's' : ''}]`
                    )
                );
                trivialGroup = [];
              }
              processedChildren.push(child);
            }
          }

          // Print remaining trivial folders
          if (trivialGroup.length > 0) {
            console.log(
              childPrefix +
                chalk.dim(
                  `└── [+ ${trivialGroup.length} minor folder${trivialGroup.length !== 1 ? 's' : ''}]`
                )
            );
          }

          // Print non-trivial children
          for (let i = 0; i < processedChildren.length; i++) {
            const child = processedChildren[i];
            const isLastChild = i === processedChildren.length - 1;
            printNode(child, childPrefix, isLastChild, depth + 1, false);
          }

          // Show file count if files exist
          if (node.children.some((child) => child.type === 'file')) {
            const fileCount = node.children.filter((child) => child.type === 'file').length;
            console.log(
              childPrefix + chalk.dim(`└── ... ${fileCount} file${fileCount !== 1 ? 's' : ''}`)
            );
          }
        }
      }
    }
  }

  printNode(flattenedTree, '', true, 0, true);

  console.log('');
}
