import { describe, expect, test } from 'bun:test';
import type { FileOwnership } from '@/core/types/ownership.types';
import { buildDirectoryTree, calculateDirectoryStats } from './tree-formatter';

describe('calculateDirectoryStats', () => {
  /**
   * Tests for directory statistics calculation:
   * - share: percentage based on file count (maxFiles / totalFiles * 100)
   * - lines: sum of totalLines from all child files
   * - owner: author with most files
   * - Nested directories
   */

  describe('single file', () => {
    test('calculates share as 100% for single file', () => {
      // Arrange
      const files: Record<string, FileOwnership> = {
        'file.ts': {
          file: 'file.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 10,
          totalLines: 10,
          authors: { 'John Doe': 10 },
        },
      };

      // Act
      const tree = buildDirectoryTree(files);
      calculateDirectoryStats(tree);

      // Assert
      expect(tree.share).toBe(100);
      expect(tree.lines).toBe(10);
      expect(tree.totalFiles).toBe(1);
      expect(tree.owner).toBe('John Doe');
    });

    test('calculates lines correctly for single file', () => {
      // Arrange
      const files: Record<string, FileOwnership> = {
        'file.ts': {
          file: 'file.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 50,
          totalLines: 50,
          authors: { 'John Doe': 50 },
        },
      };

      // Act
      const tree = buildDirectoryTree(files);
      calculateDirectoryStats(tree);

      // Assert
      expect(tree.lines).toBe(50);
    });
  });

  describe('multiple files, same owner', () => {
    test('calculates share as 100% when all files owned by same author', () => {
      // Arrange
      const files: Record<string, FileOwnership> = {
        'file1.ts': {
          file: 'file1.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 10,
          totalLines: 10,
          authors: { 'John Doe': 10 },
        },
        'file2.ts': {
          file: 'file2.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 20,
          totalLines: 20,
          authors: { 'John Doe': 20 },
        },
      };

      // Act
      const tree = buildDirectoryTree(files);
      calculateDirectoryStats(tree);

      // Assert
      expect(tree.share).toBe(100);
      expect(tree.lines).toBe(30); // 10 + 20
      expect(tree.totalFiles).toBe(2);
      expect(tree.owner).toBe('John Doe');
    });

    test('sums lines correctly for multiple files', () => {
      // Arrange
      const files: Record<string, FileOwnership> = {
        'file1.ts': {
          file: 'file1.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 100,
          totalLines: 100,
          authors: { 'John Doe': 100 },
        },
        'file2.ts': {
          file: 'file2.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 200,
          totalLines: 200,
          authors: { 'John Doe': 200 },
        },
        'file3.ts': {
          file: 'file3.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 300,
          totalLines: 300,
          authors: { 'John Doe': 300 },
        },
      };

      // Act
      const tree = buildDirectoryTree(files);
      calculateDirectoryStats(tree);

      // Assert
      expect(tree.lines).toBe(600); // 100 + 200 + 300
    });
  });

  describe('multiple files, different owners', () => {
    test('calculates share correctly when files split between authors', () => {
      // Arrange
      const files: Record<string, FileOwnership> = {
        'file1.ts': {
          file: 'file1.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 10,
          totalLines: 10,
          authors: { 'John Doe': 10 },
        },
        'file2.ts': {
          file: 'file2.ts',
          owner: 'Jane Smith',
          share: 100,
          ownerLines: 20,
          totalLines: 20,
          authors: { 'Jane Smith': 20 },
        },
        'file3.ts': {
          file: 'file3.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 30,
          totalLines: 30,
          authors: { 'John Doe': 30 },
        },
      };

      // Act
      const tree = buildDirectoryTree(files);
      calculateDirectoryStats(tree);

      // Assert
      // John Doe owns 2 files out of 3 = 67%
      expect(tree.share).toBe(67); // Math.round((2 / 3) * 100)
      expect(tree.lines).toBe(60); // 10 + 20 + 30
      expect(tree.totalFiles).toBe(3);
      expect(tree.owner).toBe('John Doe'); // Most files (2 > 1)
    });

    test('calculates share correctly for 50/50 split', () => {
      // Arrange
      const files: Record<string, FileOwnership> = {
        'file1.ts': {
          file: 'file1.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 10,
          totalLines: 10,
          authors: { 'John Doe': 10 },
        },
        'file2.ts': {
          file: 'file2.ts',
          owner: 'Jane Smith',
          share: 100,
          ownerLines: 20,
          totalLines: 20,
          authors: { 'Jane Smith': 20 },
        },
      };

      // Act
      const tree = buildDirectoryTree(files);
      calculateDirectoryStats(tree);

      // Assert
      expect(tree.share).toBe(50); // Math.round((1 / 2) * 100)
      expect(tree.lines).toBe(30); // 10 + 20
      expect(tree.totalFiles).toBe(2);
    });

    test('determines owner correctly when tied (first one wins)', () => {
      // Arrange
      const files: Record<string, FileOwnership> = {
        'file1.ts': {
          file: 'file1.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 10,
          totalLines: 10,
          authors: { 'John Doe': 10 },
        },
        'file2.ts': {
          file: 'file2.ts',
          owner: 'Jane Smith',
          share: 100,
          ownerLines: 20,
          totalLines: 20,
          authors: { 'Jane Smith': 20 },
        },
      };

      // Act
      const tree = buildDirectoryTree(files);
      calculateDirectoryStats(tree);

      // Assert
      // Both have 1 file, first one encountered becomes owner
      expect(tree.share).toBe(50);
      expect(tree.owner).toBe('John Doe'); // First in alphabetical order
    });
  });

  describe('nested directories', () => {
    test('calculates share and lines correctly for nested structure', () => {
      // Arrange
      const files: Record<string, FileOwnership> = {
        'src/file1.ts': {
          file: 'src/file1.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 10,
          totalLines: 10,
          authors: { 'John Doe': 10 },
        },
        'src/file2.ts': {
          file: 'src/file2.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 20,
          totalLines: 20,
          authors: { 'John Doe': 20 },
        },
        'src/utils/helper.ts': {
          file: 'src/utils/helper.ts',
          owner: 'Jane Smith',
          share: 100,
          ownerLines: 30,
          totalLines: 30,
          authors: { 'Jane Smith': 30 },
        },
      };

      // Act
      const tree = buildDirectoryTree(files);
      calculateDirectoryStats(tree);

      // Assert - Root level
      expect(tree.share).toBe(67); // John Doe owns 2 out of 3 files
      expect(tree.lines).toBe(60); // 10 + 20 + 30
      expect(tree.totalFiles).toBe(3);
      expect(tree.owner).toBe('John Doe');

      // Assert - src/ directory
      const srcDir = tree.children.find((child) => child.name === 'src');
      expect(srcDir).toBeDefined();
      if (srcDir) {
        calculateDirectoryStats(srcDir);
        expect(srcDir.share).toBe(67); // John Doe owns 2 out of 3 files in src/
        expect(srcDir.lines).toBe(60); // 10 + 20 + 30
        expect(srcDir.totalFiles).toBe(3);
        expect(srcDir.owner).toBe('John Doe');

        // Assert - src/utils/ directory
        const utilsDir = srcDir.children.find((child) => child.name === 'utils');
        expect(utilsDir).toBeDefined();
        if (utilsDir) {
          calculateDirectoryStats(utilsDir);
          expect(utilsDir.share).toBe(100); // Jane Smith owns 1 out of 1 file
          expect(utilsDir.lines).toBe(30);
          expect(utilsDir.totalFiles).toBe(1);
          expect(utilsDir.owner).toBe('Jane Smith');
        }
      }
    });

    test('aggregates lines correctly across nested directories', () => {
      // Arrange
      const files: Record<string, FileOwnership> = {
        'src/index.ts': {
          file: 'src/index.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 100,
          totalLines: 100,
          authors: { 'John Doe': 100 },
        },
        'src/utils/helper.ts': {
          file: 'src/utils/helper.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 200,
          totalLines: 200,
          authors: { 'John Doe': 200 },
        },
        'src/utils/validator.ts': {
          file: 'src/utils/validator.ts',
          owner: 'Jane Smith',
          share: 100,
          ownerLines: 300,
          totalLines: 300,
          authors: { 'Jane Smith': 300 },
        },
      };

      // Act
      const tree = buildDirectoryTree(files);
      calculateDirectoryStats(tree);

      // Assert - Root
      expect(tree.lines).toBe(600); // 100 + 200 + 300

      // Assert - src/ directory
      const srcDir = tree.children.find((child) => child.name === 'src');
      if (srcDir) {
        calculateDirectoryStats(srcDir);
        expect(srcDir.lines).toBe(600); // 100 + 200 + 300

        // Assert - src/utils/ directory
        const utilsDir = srcDir.children.find((child) => child.name === 'utils');
        if (utilsDir) {
          calculateDirectoryStats(utilsDir);
          expect(utilsDir.lines).toBe(500); // 200 + 300
        }
      }
    });
  });

  describe('edge cases', () => {
    test('handles empty directory (no files)', () => {
      // Arrange
      const files: Record<string, FileOwnership> = {};

      // Act
      const tree = buildDirectoryTree(files);
      calculateDirectoryStats(tree);

      // Assert
      expect(tree.share).toBe(0);
      expect(tree.lines).toBe(0);
      expect(tree.totalFiles).toBe(0);
      // Owner is empty string when no files exist
      expect(tree.owner).toBe('');
    });

    test('handles files with 0 lines correctly', () => {
      // Arrange
      const files: Record<string, FileOwnership> = {
        'file1.ts': {
          file: 'file1.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 0,
          totalLines: 0,
          authors: { 'John Doe': 0 },
        },
        'file2.ts': {
          file: 'file2.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 10,
          totalLines: 10,
          authors: { 'John Doe': 10 },
        },
      };

      // Act
      const tree = buildDirectoryTree(files);
      calculateDirectoryStats(tree);

      // Assert
      expect(tree.lines).toBe(10); // 0 + 10
      expect(tree.totalFiles).toBe(2);
      expect(tree.share).toBe(100); // John Doe owns both files
    });

    test('rounds share percentage correctly', () => {
      // Arrange - 1 file out of 3 = 33.33...% should round to 33%
      const files: Record<string, FileOwnership> = {
        'file1.ts': {
          file: 'file1.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 10,
          totalLines: 10,
          authors: { 'John Doe': 10 },
        },
        'file2.ts': {
          file: 'file2.ts',
          owner: 'Jane Smith',
          share: 100,
          ownerLines: 20,
          totalLines: 20,
          authors: { 'Jane Smith': 20 },
        },
        'file3.ts': {
          file: 'file3.ts',
          owner: 'Bob Wilson',
          share: 100,
          ownerLines: 30,
          totalLines: 30,
          authors: { 'Bob Wilson': 30 },
        },
      };

      // Act
      const tree = buildDirectoryTree(files);
      calculateDirectoryStats(tree);

      // Assert
      // Each author owns 1 file out of 3 = 33.33...% rounds to 33%
      expect(tree.share).toBe(33); // Math.round((1 / 3) * 100)
    });

    test('handles very large line counts', () => {
      // Arrange
      const files: Record<string, FileOwnership> = {
        'file1.ts': {
          file: 'file1.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 999999,
          totalLines: 999999,
          authors: { 'John Doe': 999999 },
        },
        'file2.ts': {
          file: 'file2.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 888888,
          totalLines: 888888,
          authors: { 'John Doe': 888888 },
        },
      };

      // Act
      const tree = buildDirectoryTree(files);
      calculateDirectoryStats(tree);

      // Assert
      expect(tree.lines).toBe(1888887); // 999999 + 888888
    });
  });

  describe('share percentage calculation accuracy', () => {
    test('calculates 100% for single owner', () => {
      const files: Record<string, FileOwnership> = {
        'file.ts': {
          file: 'file.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 10,
          totalLines: 10,
          authors: { 'John Doe': 10 },
        },
      };

      const tree = buildDirectoryTree(files);
      calculateDirectoryStats(tree);

      expect(tree.share).toBe(100);
    });

    test('calculates 50% for two owners with equal files', () => {
      const files: Record<string, FileOwnership> = {
        'file1.ts': {
          file: 'file1.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 10,
          totalLines: 10,
          authors: { 'John Doe': 10 },
        },
        'file2.ts': {
          file: 'file2.ts',
          owner: 'Jane Smith',
          share: 100,
          ownerLines: 20,
          totalLines: 20,
          authors: { 'Jane Smith': 20 },
        },
      };

      const tree = buildDirectoryTree(files);
      calculateDirectoryStats(tree);

      expect(tree.share).toBe(50);
    });

    test('calculates 67% for 2 out of 3 files', () => {
      const files: Record<string, FileOwnership> = {
        'file1.ts': {
          file: 'file1.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 10,
          totalLines: 10,
          authors: { 'John Doe': 10 },
        },
        'file2.ts': {
          file: 'file2.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 20,
          totalLines: 20,
          authors: { 'John Doe': 20 },
        },
        'file3.ts': {
          file: 'file3.ts',
          owner: 'Jane Smith',
          share: 100,
          ownerLines: 30,
          totalLines: 30,
          authors: { 'Jane Smith': 30 },
        },
      };

      const tree = buildDirectoryTree(files);
      calculateDirectoryStats(tree);

      expect(tree.share).toBe(67); // Math.round((2 / 3) * 100) = 67
    });

    test('calculates 33% for 1 out of 3 files', () => {
      const files: Record<string, FileOwnership> = {
        'file1.ts': {
          file: 'file1.ts',
          owner: 'John Doe',
          share: 100,
          ownerLines: 10,
          totalLines: 10,
          authors: { 'John Doe': 10 },
        },
        'file2.ts': {
          file: 'file2.ts',
          owner: 'Jane Smith',
          share: 100,
          ownerLines: 20,
          totalLines: 20,
          authors: { 'Jane Smith': 20 },
        },
        'file3.ts': {
          file: 'file3.ts',
          owner: 'Bob Wilson',
          share: 100,
          ownerLines: 30,
          totalLines: 30,
          authors: { 'Bob Wilson': 30 },
        },
      };

      const tree = buildDirectoryTree(files);
      calculateDirectoryStats(tree);

      expect(tree.share).toBe(33); // Math.round((1 / 3) * 100) = 33
    });
  });
});
