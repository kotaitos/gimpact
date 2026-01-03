import { describe, expect, test } from 'bun:test';
import { parsePeriodStats } from './period-log-parser';

describe('parsePeriodStats', () => {
  /**
   * Equivalence partitioning:
   * - Grouping: daily, weekly, monthly
   * - Input: empty, single commit, multiple commits (same/different periods)
   * - Author filter: none, single/multiple, case sensitivity
   *
   * Boundary values:
   * - Period boundaries (date change, week change, month change)
   * - Sort order (period descending, impact descending within same period)
   */

  describe('empty and minimal input', () => {
    test('returns empty array for empty string', () => {
      // Arrange
      const log = '';
      const periodUnit = 'daily';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result).toEqual([]);
    });

    test('returns empty array for whitespace only', () => {
      // Arrange
      const log = '   \n   \n   ';
      const periodUnit = 'weekly';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('daily grouping', () => {
    test('parses single commit correctly', () => {
      // Arrange
      const log = `John Doe|2025-12-15 10:30:00 +0900
10\t5\tfile.ts`;
      const periodUnit = 'daily';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        period: '2025-12-15',
        author: 'John Doe',
        stats: {
          commits: 1,
          insertions: 10,
          deletions: 5,
          filesTouched: 1,
        },
      });
    });

    test('aggregates multiple commits on same day', () => {
      // Arrange
      const log = `John Doe|2025-12-15 10:30:00 +0900
10\t5\tfile1.ts

John Doe|2025-12-15 14:00:00 +0900
20\t10\tfile2.ts`;
      const periodUnit = 'daily';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].stats.commits).toBe(2);
      expect(result[0].stats.insertions).toBe(30);
      expect(result[0].stats.deletions).toBe(15);
    });

    test('creates separate entries for different days', () => {
      // Arrange
      const log = `John Doe|2025-12-15 10:30:00 +0900
10\t5\tfile1.ts

John Doe|2025-12-16 10:30:00 +0900
20\t10\tfile2.ts`;
      const periodUnit = 'daily';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result).toHaveLength(2);
      // Sorted by period descending
      expect(result[0].period).toBe('2025-12-16');
      expect(result[1].period).toBe('2025-12-15');
    });

    test('treats different dates as separate days', () => {
      // Arrange
      const log = `John Doe|2025-12-15 12:00:00 +0000
10\t5\tfile1.ts

John Doe|2025-12-16 12:00:00 +0000
20\t10\tfile2.ts`;
      const periodUnit = 'daily';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.period).sort()).toEqual(['2025-12-15', '2025-12-16']);
    });
  });

  describe('weekly grouping', () => {
    test('aggregates commits in same week', () => {
      // Arrange
      const log = `John Doe|2025-12-15 10:30:00 +0900
10\t5\tfile1.ts

John Doe|2025-12-17 10:30:00 +0900
20\t10\tfile2.ts`;
      const periodUnit = 'weekly';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].period).toBe('2025-W51');
      expect(result[0].stats.commits).toBe(2);
    });

    test('creates separate entries for different weeks', () => {
      // Arrange
      const log = `John Doe|2025-12-15 10:30:00 +0900
10\t5\tfile1.ts

John Doe|2025-12-22 10:30:00 +0900
20\t10\tfile2.ts`;
      const periodUnit = 'weekly';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result).toHaveLength(2);
      // Sorted by period descending
      expect(result[0].period).toBe('2025-W52');
      expect(result[1].period).toBe('2025-W51');
    });

    test('handles year-crossing week correctly (Dec 31, 2025 is 2026-W01)', () => {
      // Arrange
      const log = `John Doe|2025-12-31 10:30:00 +0900
10\t5\tfile.ts`;
      const periodUnit = 'weekly';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].period).toBe('2026-W01');
    });
  });

  describe('monthly grouping', () => {
    test('aggregates commits in same month', () => {
      // Arrange
      const log = `John Doe|2025-12-01 10:30:00 +0900
10\t5\tfile1.ts

John Doe|2025-12-31 10:30:00 +0900
20\t10\tfile2.ts`;
      const periodUnit = 'monthly';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].period).toBe('2025-12');
      expect(result[0].stats.commits).toBe(2);
    });

    test('creates separate entries for different months', () => {
      // Arrange
      const log = `John Doe|2025-11-15 10:30:00 +0900
10\t5\tfile1.ts

John Doe|2025-12-15 10:30:00 +0900
20\t10\tfile2.ts`;
      const periodUnit = 'monthly';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result).toHaveLength(2);
      // Sorted by period descending
      expect(result[0].period).toBe('2025-12');
      expect(result[1].period).toBe('2025-11');
    });

    test('handles year-crossing month correctly', () => {
      // Arrange
      const log = `John Doe|2025-12-15 10:30:00 +0900
10\t5\tfile1.ts

John Doe|2026-01-15 10:30:00 +0900
20\t10\tfile2.ts`;
      const periodUnit = 'monthly';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].period).toBe('2026-01');
      expect(result[1].period).toBe('2025-12');
    });
  });

  describe('multiple authors', () => {
    test('creates separate entries for different authors in same period', () => {
      // Arrange
      const log = `John Doe|2025-12-15 10:30:00 +0900
10\t5\tfile1.ts

Jane Smith|2025-12-15 14:00:00 +0900
20\t10\tfile2.ts`;
      const periodUnit = 'daily';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].period).toBe('2025-12-15');
      expect(result[1].period).toBe('2025-12-15');
      // Within same period, sorted by impact descending
      expect(result[0].author).toBe('Jane Smith'); // impact: 30
      expect(result[1].author).toBe('John Doe'); // impact: 15
    });

    test('handles different periods with different authors correctly', () => {
      // Arrange
      const log = `John Doe|2025-12-15 10:30:00 +0900
10\t5\tfile1.ts

Jane Smith|2025-12-16 14:00:00 +0900
20\t10\tfile2.ts`;
      const periodUnit = 'daily';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result).toHaveLength(2);
      // Sorted by period descending
      expect(result[0].period).toBe('2025-12-16');
      expect(result[0].author).toBe('Jane Smith');
      expect(result[1].period).toBe('2025-12-15');
      expect(result[1].author).toBe('John Doe');
    });
  });

  describe('author filter', () => {
    const multiAuthorLog = `John Doe|2025-12-15 10:30:00 +0900
10\t5\tfile1.ts

Jane Smith|2025-12-15 14:00:00 +0900
20\t10\tfile2.ts

Bob Wilson|2025-12-15 16:00:00 +0900
15\t8\tfile3.ts`;

    test('includes only specified author in filter', () => {
      // Arrange
      const periodUnit = 'daily';
      const authorFilter = ['John Doe'];

      // Act
      const result = parsePeriodStats(multiAuthorLog, periodUnit, authorFilter);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].author).toBe('John Doe');
    });

    test('allows multiple authors in filter', () => {
      // Arrange
      const periodUnit = 'daily';
      const authorFilter = ['John Doe', 'Jane Smith'];

      // Act
      const result = parsePeriodStats(multiAuthorLog, periodUnit, authorFilter);

      // Assert
      expect(result).toHaveLength(2);
      const authors = result.map((r) => r.author);
      expect(authors).toContain('John Doe');
      expect(authors).toContain('Jane Smith');
      expect(authors).not.toContain('Bob Wilson');
    });

    test('author filter is case-insensitive', () => {
      // Arrange
      const periodUnit = 'daily';
      const authorFilter = ['john doe'];

      // Act
      const result = parsePeriodStats(multiAuthorLog, periodUnit, authorFilter);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].author).toBe('John Doe');
    });

    test('returns empty array when no authors match filter', () => {
      // Arrange
      const periodUnit = 'daily';
      const authorFilter = ['Unknown Author'];

      // Act
      const result = parsePeriodStats(multiAuthorLog, periodUnit, authorFilter);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('sorting', () => {
    test('sorts by period descending', () => {
      // Arrange
      const log = `John Doe|2025-12-10 10:30:00 +0900
10\t5\tfile1.ts

John Doe|2025-12-15 10:30:00 +0900
20\t10\tfile2.ts

John Doe|2025-12-12 10:30:00 +0900
15\t8\tfile3.ts`;
      const periodUnit = 'daily';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result.map((r) => r.period)).toEqual(['2025-12-15', '2025-12-12', '2025-12-10']);
    });

    test('sorts by impact descending within same period', () => {
      // Arrange
      const log = `Alice|2025-12-15 10:00:00 +0900
10\t5\tfile1.ts

Bob|2025-12-15 11:00:00 +0900
50\t30\tfile2.ts

Charlie|2025-12-15 12:00:00 +0900
20\t10\tfile3.ts`;
      const periodUnit = 'daily';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result.map((r) => r.author)).toEqual(['Bob', 'Charlie', 'Alice']);
      // Bob: 80, Charlie: 30, Alice: 15
    });
  });

  describe('edge cases', () => {
    test('handles author name with special characters', () => {
      // Arrange
      const log = `John O'Connor|2025-12-15 10:30:00 +0900
10\t5\tfile.ts`;
      const periodUnit = 'daily';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result[0].author).toBe("John O'Connor");
    });

    test('handles author name with Japanese characters', () => {
      // Arrange
      const log = `山田太郎|2025-12-15 10:30:00 +0900
10\t5\tfile.ts`;
      const periodUnit = 'daily';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result[0].author).toBe('山田太郎');
    });

    test('handles date with timezone correctly', () => {
      // Arrange
      const log = `John Doe|2025-12-15 10:30:00 +0000
10\t5\tfile.ts`;
      const periodUnit = 'daily';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].period).toBe('2025-12-15');
    });

    test('treats binary files as 0', () => {
      // Arrange
      const log = `John Doe|2025-12-15 10:30:00 +0900
-\t-\timage.png
10\t5\tcode.ts`;
      const periodUnit = 'daily';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result[0].stats.insertions).toBe(10);
      expect(result[0].stats.deletions).toBe(5);
    });

    test('counts commit with no file changes', () => {
      // Arrange
      const log = `John Doe|2025-12-15 10:30:00 +0900

Jane Smith|2025-12-15 14:00:00 +0900
10\t5\tfile.ts`;
      const periodUnit = 'daily';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result).toHaveLength(2);
      const johnEntry = result.find((r) => r.author === 'John Doe');
      expect(johnEntry?.stats.commits).toBe(1);
      expect(johnEntry?.stats.insertions).toBe(0);
      expect(johnEntry?.stats.deletions).toBe(0);
    });

    test('handles very large numbers correctly', () => {
      // Arrange
      const log = `John Doe|2025-12-15 10:30:00 +0900
999999\t888888\tlarge-file.ts`;
      const periodUnit = 'daily';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result[0].stats.insertions).toBe(999999);
      expect(result[0].stats.deletions).toBe(888888);
    });
  });

  describe('realistic git log output', () => {
    test('parses complex multi-period multi-author log correctly', () => {
      // Arrange
      const log = `John Doe|2025-12-15 10:30:00 +0900
15\t3\tsrc/index.ts
25\t10\tsrc/utils.ts

Jane Smith|2025-12-15 14:00:00 +0900
100\t0\tsrc/new-feature.ts

John Doe|2025-12-16 09:00:00 +0900
8\t8\tsrc/refactor.ts

Jane Smith|2025-12-16 11:00:00 +0900
5\t2\tpackage.json`;
      const periodUnit = 'daily';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result).toHaveLength(4);

      // 2025-12-16 entries (period descending)
      const dec16Entries = result.filter((r) => r.period === '2025-12-16');
      expect(dec16Entries).toHaveLength(2);
      // John: impact 16, Jane: impact 7 → John first
      expect(dec16Entries[0].author).toBe('John Doe');
      expect(dec16Entries[1].author).toBe('Jane Smith');

      // 2025-12-15 entries
      const dec15Entries = result.filter((r) => r.period === '2025-12-15');
      expect(dec15Entries).toHaveLength(2);
      // Jane: impact 100, John: impact 53 → Jane first
      expect(dec15Entries[0].author).toBe('Jane Smith');
      expect(dec15Entries[1].author).toBe('John Doe');
    });

    test('parses weekly grouping complex case correctly', () => {
      // Arrange
      const log = `John Doe|2025-12-15 10:30:00 +0900
10\t5\tfile1.ts

John Doe|2025-12-17 10:30:00 +0900
20\t10\tfile2.ts

Jane Smith|2025-12-22 10:30:00 +0900
30\t15\tfile3.ts`;
      const periodUnit = 'weekly';

      // Act
      const result = parsePeriodStats(log, periodUnit);

      // Assert
      expect(result).toHaveLength(2);
      // W52 (Jane), W51 (John)
      expect(result[0].period).toBe('2025-W52');
      expect(result[0].author).toBe('Jane Smith');

      expect(result[1].period).toBe('2025-W51');
      expect(result[1].author).toBe('John Doe');
      expect(result[1].stats.commits).toBe(2); // commits from 12/15 and 12/17 aggregated
    });
  });
});
