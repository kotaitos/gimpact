import { describe, expect, test } from 'bun:test';
import { parseAggregateStats } from './aggregate-log-parser';

describe('parseAggregateStats', () => {
  /**
   * Equivalence partitioning:
   * - Input log: empty string, single author/single commit, single author/multiple commits,
   *              multiple authors/multiple commits, with author filter
   * - File changes: insertions only, deletions only, both, binary files (- notation)
   *
   * Boundary values:
   * - 0 commits, 1 commit
   * - 0 line changes
   * - Author name case sensitivity
   */

  describe('empty and minimal input', () => {
    test('returns empty object for empty string', () => {
      // Arrange
      const log = '';

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(result).toEqual({});
    });

    test('returns empty object for whitespace only', () => {
      // Arrange
      const log = '   \n   \n   ';

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(result).toEqual({});
    });

    test('returns empty object for newlines only', () => {
      // Arrange
      const log = '\n\n\n';

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(result).toEqual({});
    });
  });

  describe('single author', () => {
    test('parses single author, single commit, single file', () => {
      // Arrange
      const log = `John Doe
10\t5\tfile.ts`;

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(result).toEqual({
        'John Doe': {
          commits: 1,
          insertions: 10,
          deletions: 5,
          filesTouched: 1,
        },
      });
    });

    test('parses single author, single commit, multiple files', () => {
      // Arrange
      const log = `John Doe
10\t5\tfile1.ts
20\t3\tfile2.ts
5\t0\tfile3.ts`;

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(result).toEqual({
        'John Doe': {
          commits: 1,
          insertions: 35, // 10 + 20 + 5
          deletions: 8, // 5 + 3 + 0
          filesTouched: 3,
        },
      });
    });

    test('parses single author with multiple commits', () => {
      // Arrange
      const log = `John Doe
10\t5\tfile1.ts

John Doe
20\t10\tfile2.ts`;

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(result).toEqual({
        'John Doe': {
          commits: 2,
          insertions: 30,
          deletions: 15,
          filesTouched: 2,
        },
      });
    });
  });

  describe('multiple authors', () => {
    test('aggregates stats separately for multiple authors', () => {
      // Arrange
      const log = `John Doe
10\t5\tfile1.ts

Jane Smith
20\t10\tfile2.ts

John Doe
5\t2\tfile3.ts`;

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(result).toEqual({
        'John Doe': {
          commits: 2,
          insertions: 15,
          deletions: 7,
          filesTouched: 2,
        },
        'Jane Smith': {
          commits: 1,
          insertions: 20,
          deletions: 10,
          filesTouched: 1,
        },
      });
    });

    test('handles three or more authors correctly', () => {
      // Arrange
      const log = `Alice
10\t0\ta.ts

Bob
5\t5\tb.ts

Charlie
0\t10\tc.ts`;

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(Object.keys(result)).toHaveLength(3);
      expect(result['Alice'].commits).toBe(1);
      expect(result['Bob'].commits).toBe(1);
      expect(result['Charlie'].commits).toBe(1);
    });
  });

  describe('file change patterns', () => {
    test('handles insertions only (deletions = 0)', () => {
      // Arrange
      const log = `John Doe
100\t0\tnew-file.ts`;

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(result['John Doe'].insertions).toBe(100);
      expect(result['John Doe'].deletions).toBe(0);
    });

    test('handles deletions only (insertions = 0)', () => {
      // Arrange
      const log = `John Doe
0\t50\tdeleted-content.ts`;

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(result['John Doe'].insertions).toBe(0);
      expect(result['John Doe'].deletions).toBe(50);
    });

    test('treats binary files (-\\t- notation) as 0', () => {
      // Arrange
      const log = `John Doe
-\t-\timage.png
10\t5\tcode.ts`;

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(result['John Doe'].insertions).toBe(10);
      expect(result['John Doe'].deletions).toBe(5);
    });

    test('handles no changes (0\\t0) correctly', () => {
      // Arrange
      const log = `John Doe
0\t0\tunchanged.ts`;

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(result['John Doe'].insertions).toBe(0);
      expect(result['John Doe'].deletions).toBe(0);
    });
  });

  describe('author filter', () => {
    const multiAuthorLog = `John Doe
10\t5\tfile1.ts

Jane Smith
20\t10\tfile2.ts

Bob Wilson
15\t8\tfile3.ts`;

    test('includes only specified author in filter', () => {
      // Arrange
      const authorFilter = ['John Doe'];

      // Act
      const result = parseAggregateStats(multiAuthorLog, authorFilter);

      // Assert
      expect(result).toEqual({
        'John Doe': {
          commits: 1,
          insertions: 10,
          deletions: 5,
          filesTouched: 1,
        },
      });
      expect(result['Jane Smith']).toBeUndefined();
      expect(result['Bob Wilson']).toBeUndefined();
    });

    test('allows multiple authors in filter', () => {
      // Arrange
      const authorFilter = ['John Doe', 'Jane Smith'];

      // Act
      const result = parseAggregateStats(multiAuthorLog, authorFilter);

      // Assert
      expect(Object.keys(result)).toHaveLength(2);
      expect(result['John Doe']).toBeDefined();
      expect(result['Jane Smith']).toBeDefined();
      expect(result['Bob Wilson']).toBeUndefined();
    });

    test('author filter is case-insensitive', () => {
      // Arrange
      const authorFilter = ['john doe'];

      // Act
      const result = parseAggregateStats(multiAuthorLog, authorFilter);

      // Assert
      expect(result).toEqual({
        'John Doe': {
          commits: 1,
          insertions: 10,
          deletions: 5,
          filesTouched: 1,
        },
      });
    });

    test('author filter matches with mixed case', () => {
      // Arrange
      const authorFilter = ['JOHN DOE', 'jane SMITH'];

      // Act
      const result = parseAggregateStats(multiAuthorLog, authorFilter);

      // Assert
      expect(Object.keys(result)).toHaveLength(2);
      expect(result['John Doe']).toBeDefined();
      expect(result['Jane Smith']).toBeDefined();
    });

    test('returns empty object when no authors match filter', () => {
      // Arrange
      const authorFilter = ['Unknown Author'];

      // Act
      const result = parseAggregateStats(multiAuthorLog, authorFilter);

      // Assert
      expect(result).toEqual({});
    });

    test('empty author filter array results in empty output', () => {
      // Arrange
      const authorFilter: string[] = [];

      // Act
      const result = parseAggregateStats(multiAuthorLog, authorFilter);

      // Assert
      expect(Object.keys(result)).toHaveLength(0);
    });

    test('undefined author filter includes all authors', () => {
      // Arrange
      const authorFilter = undefined;

      // Act
      const result = parseAggregateStats(multiAuthorLog, authorFilter);

      // Assert
      expect(Object.keys(result)).toHaveLength(3);
    });
  });

  describe('edge cases', () => {
    test('handles author name with special characters', () => {
      // Arrange
      const log = `John O'Connor
10\t5\tfile.ts`;

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(result["John O'Connor"]).toBeDefined();
      expect(result["John O'Connor"].commits).toBe(1);
    });

    test('handles author name with Japanese characters', () => {
      // Arrange
      const log = `山田太郎
10\t5\tfile.ts`;

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(result['山田太郎']).toBeDefined();
      expect(result['山田太郎'].commits).toBe(1);
    });

    test('handles file path with spaces', () => {
      // Arrange
      const log = `John Doe
10\t5\tpath/to/my file.ts`;

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(result['John Doe'].insertions).toBe(10);
      expect(result['John Doe'].deletions).toBe(5);
    });

    test('handles very large numbers correctly', () => {
      // Arrange
      const log = `John Doe
999999\t888888\tlarge-file.ts`;

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(result['John Doe'].insertions).toBe(999999);
      expect(result['John Doe'].deletions).toBe(888888);
    });

    test('handles consecutive empty lines correctly', () => {
      // Arrange
      const log = `John Doe
10\t5\tfile1.ts



Jane Smith
20\t10\tfile2.ts`;

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(Object.keys(result)).toHaveLength(2);
    });

    test('counts commit with no file changes correctly', () => {
      // Arrange
      const log = `John Doe

Jane Smith
10\t5\tfile.ts`;

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(result['John Doe'].commits).toBe(1);
      expect(result['John Doe'].insertions).toBe(0);
      expect(result['John Doe'].deletions).toBe(0);
    });
  });

  describe('realistic git log output', () => {
    test('parses complex realistic log output correctly', () => {
      // Arrange
      const log = `John Doe
15\t3\tsrc/index.ts
25\t10\tsrc/utils.ts
0\t50\tREADME.md

Jane Smith
100\t0\tsrc/new-feature.ts
5\t2\tpackage.json

John Doe
8\t8\tsrc/refactor.ts
-\t-\tassets/logo.png`;

      // Act
      const result = parseAggregateStats(log);

      // Assert
      expect(result['John Doe']).toEqual({
        commits: 2,
        insertions: 48, // 15 + 25 + 0 + 8 + 0(binary)
        deletions: 71, // 3 + 10 + 50 + 8 + 0(binary)
        filesTouched: 5, // index.ts, utils.ts, README.md, refactor.ts, logo.png
      });

      expect(result['Jane Smith']).toEqual({
        commits: 1,
        insertions: 105,
        deletions: 2,
        filesTouched: 2, // new-feature.ts, package.json
      });
    });
  });
});
