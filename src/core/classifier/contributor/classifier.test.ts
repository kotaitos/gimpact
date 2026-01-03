import { describe, expect, test } from 'bun:test';
import type { AuthorStats, AuthorStatsMap } from '../../types';
import {
  calculateAverageFilesTouched,
  classifyAllContributors,
  classifyContributor,
  getContributorTypeInfo,
} from './classifier';

describe('classifyContributor', () => {
  /**
   * Classification priority order:
   * 1. Scout: totalDelta < 10 (quick, small contributions)
   * 2. Generalist: filesTouched > avgFilesTouched * 1.5 (cross-project visibility)
   * 3. Refactorer: deletionRatio >= 0.4 (code cleanup)
   * 4. Explorer: insertionRatio > 0.7 (new code)
   * 5. Artisan: default (balanced, reliable work)
   *
   * Boundary values:
   * - total changes at 10 (Scout threshold)
   * - filesTouched at 1.5x average (Generalist threshold)
   * - deletionRatio at 0.4 (Refactorer threshold)
   * - insertionRatio at 0.7 (Explorer threshold)
   */

  describe('Scout classification', () => {
    test('classifies as Scout when total changes is zero', () => {
      const stats: AuthorStats = {
        commits: 5,
        insertions: 0,
        deletions: 0,
        filesTouched: 0,
      };
      const avgFilesTouched = 10;
      const result = classifyContributor(stats, avgFilesTouched);
      expect(result).toBe('Scout');
    });

    test('classifies as Scout when total changes < 10', () => {
      const stats: AuthorStats = {
        commits: 1,
        insertions: 9,
        deletions: 0,
        filesTouched: 1,
      };
      const avgFilesTouched = 1;
      const result = classifyContributor(stats, avgFilesTouched);
      expect(result).toBe('Scout');
    });

    test('classifies as Scout for +1/-1 type contributions', () => {
      const stats: AuthorStats = {
        commits: 1,
        insertions: 1,
        deletions: 1,
        filesTouched: 1,
      };
      const avgFilesTouched = 10;
      const result = classifyContributor(stats, avgFilesTouched);
      expect(result).toBe('Scout');
    });

    test('does not classify as Scout when total changes equals 100', () => {
      const stats: AuthorStats = {
        commits: 1,
        insertions: 100,
        deletions: 0,
        filesTouched: 1,
      };
      const avgFilesTouched = 10;
      const result = classifyContributor(stats, avgFilesTouched);
      expect(result).not.toBe('Scout');
    });
  });

  describe('Generalist classification', () => {
    test('classifies as Generalist when filesTouched > 2.5x avgFilesTouched', () => {
      const stats: AuthorStats = {
        commits: 10,
        insertions: 650,
        deletions: 350,
        filesTouched: 30, // > 10 * 2.5 = 25
      };
      const avgFilesTouched = 10;
      const result = classifyContributor(stats, avgFilesTouched);
      expect(result).toBe('Generalist');
    });

    test('does not classify as Generalist when filesTouched equals 2.5x avgFilesTouched', () => {
      const stats: AuthorStats = {
        commits: 10,
        insertions: 650,
        deletions: 350,
        filesTouched: 25, // exactly 2.5x
      };
      const avgFilesTouched = 10;
      const result = classifyContributor(stats, avgFilesTouched);
      expect(result).not.toBe('Generalist');
    });

    test('Refactorer takes priority over Generalist', () => {
      const stats: AuthorStats = {
        commits: 10,
        insertions: 300,
        deletions: 700,
        filesTouched: 50,
      };
      const avgFilesTouched = 10;
      const result = classifyContributor(stats, avgFilesTouched);
      expect(result).toBe('Refactorer');
    });

    test('Explorer takes priority over Generalist', () => {
      const stats: AuthorStats = {
        commits: 10,
        insertions: 950,
        deletions: 50,
        filesTouched: 50,
      };
      const avgFilesTouched = 10;
      const result = classifyContributor(stats, avgFilesTouched);
      expect(result).toBe('Explorer');
    });
  });

  describe('Refactorer classification', () => {
    test('classifies as Refactorer when deletionRatio >= 0.4', () => {
      const stats: AuthorStats = {
        commits: 10,
        insertions: 100,
        deletions: 200,
        filesTouched: 5,
      };
      const avgFilesTouched = 10;
      const result = classifyContributor(stats, avgFilesTouched);
      expect(result).toBe('Refactorer');
    });

    test('classifies as Refactorer when deletionRatio equals 0.4', () => {
      const stats: AuthorStats = {
        commits: 10,
        insertions: 600,
        deletions: 400,
        filesTouched: 5,
      };
      const avgFilesTouched = 10;
      const result = classifyContributor(stats, avgFilesTouched);
      expect(result).toBe('Refactorer');
    });

    test('does not classify as Refactorer when deletionRatio is just below 0.4', () => {
      const stats: AuthorStats = {
        commits: 10,
        insertions: 610,
        deletions: 390,
        filesTouched: 5,
      };
      const avgFilesTouched = 10;
      const result = classifyContributor(stats, avgFilesTouched);
      expect(result).not.toBe('Refactorer');
    });

    test('Refactorer takes priority over Explorer', () => {
      const stats: AuthorStats = {
        commits: 10,
        insertions: 500,
        deletions: 500,
        filesTouched: 5,
      };
      const avgFilesTouched = 10;
      const result = classifyContributor(stats, avgFilesTouched);
      expect(result).toBe('Refactorer');
    });
  });

  describe('Explorer classification', () => {
    test('classifies as Explorer when insertionRatio > 0.7', () => {
      const stats: AuthorStats = {
        commits: 10,
        insertions: 800,
        deletions: 200,
        filesTouched: 5,
      };
      const avgFilesTouched = 10;
      const result = classifyContributor(stats, avgFilesTouched);
      expect(result).toBe('Explorer');
    });

    test('does not classify as Explorer when insertionRatio equals 0.7', () => {
      const stats: AuthorStats = {
        commits: 10,
        insertions: 700,
        deletions: 300,
        filesTouched: 5,
      };
      const avgFilesTouched = 10;
      const result = classifyContributor(stats, avgFilesTouched);
      expect(result).not.toBe('Explorer');
    });

    test('classifies as Explorer when insertionRatio is just above 0.7', () => {
      const stats: AuthorStats = {
        commits: 10,
        insertions: 710,
        deletions: 290,
        filesTouched: 5,
      };
      const avgFilesTouched = 10;
      const result = classifyContributor(stats, avgFilesTouched);
      expect(result).toBe('Explorer');
    });
  });

  describe('Artisan classification', () => {
    test('classifies as Artisan when no other criteria met', () => {
      const stats: AuthorStats = {
        commits: 50,
        insertions: 650,
        deletions: 350,
        filesTouched: 5,
      };
      const avgFilesTouched = 10;
      const result = classifyContributor(stats, avgFilesTouched);
      expect(result).toBe('Artisan');
    });

    test('classifies as Artisan with exactly 70% insertions', () => {
      const stats: AuthorStats = {
        commits: 10,
        insertions: 700,
        deletions: 300,
        filesTouched: 5,
      };
      const avgFilesTouched = 10;
      const result = classifyContributor(stats, avgFilesTouched);
      expect(result).toBe('Artisan');
    });
  });
});

describe('calculateAverageFilesTouched', () => {
  test('returns 0 for empty stats map', () => {
    const statsMap: AuthorStatsMap = {};
    const result = calculateAverageFilesTouched(statsMap);
    expect(result).toBe(0);
  });

  test('returns exact value for single author', () => {
    const statsMap: AuthorStatsMap = {
      'John Doe': { commits: 10, insertions: 100, deletions: 50, filesTouched: 15 },
    };
    const result = calculateAverageFilesTouched(statsMap);
    expect(result).toBe(15);
  });

  test('calculates average for multiple authors', () => {
    const statsMap: AuthorStatsMap = {
      'John Doe': { commits: 10, insertions: 100, deletions: 50, filesTouched: 10 },
      'Jane Smith': { commits: 20, insertions: 200, deletions: 100, filesTouched: 20 },
      'Bob Wilson': { commits: 5, insertions: 50, deletions: 25, filesTouched: 30 },
    };
    const result = calculateAverageFilesTouched(statsMap);
    expect(result).toBe(20);
  });
});

describe('getContributorTypeInfo', () => {
  test('returns correct info for Scout', () => {
    const result = getContributorTypeInfo('Scout');
    expect(result.emoji).toBe('✨');
    expect(result.label).toBe('✨ Scout');
  });

  test('returns correct info for Generalist', () => {
    const result = getContributorTypeInfo('Generalist');
    expect(result.emoji).toBe('👤');
    expect(result.label).toBe('👤 Generalist');
  });

  test('returns correct info for Refactorer', () => {
    const result = getContributorTypeInfo('Refactorer');
    expect(result.emoji).toBe('🛠');
    expect(result.label).toBe('🛠 Refactorer');
  });

  test('returns correct info for Explorer', () => {
    const result = getContributorTypeInfo('Explorer');
    expect(result.emoji).toBe('🚀');
    expect(result.label).toBe('🚀 Explorer');
  });

  test('returns correct info for Artisan', () => {
    const result = getContributorTypeInfo('Artisan');
    expect(result.emoji).toBe('💎');
    expect(result.label).toBe('💎 Artisan');
  });
});

describe('classifyAllContributors', () => {
  test('classifies all contributors in stats map', () => {
    // avg filesTouched = (5 + 100 + 10) / 3 = ~38.33
    // Generalist needs > 38.33 * 2.5 = ~95.8, so 100 IS Generalist
    const statsMap: AuthorStatsMap = {
      ExplorerPerson: { commits: 10, insertions: 800, deletions: 200, filesTouched: 5 },
      GeneralistPerson: { commits: 10, insertions: 650, deletions: 350, filesTouched: 100 },
      RefactorerPerson: { commits: 10, insertions: 500, deletions: 500, filesTouched: 10 },
    };
    const result = classifyAllContributors(statsMap);
    expect(result['ExplorerPerson']).toBe('Explorer');
    expect(result['GeneralistPerson']).toBe('Generalist');
    expect(result['RefactorerPerson']).toBe('Refactorer');
  });

  test('returns empty object for empty stats map', () => {
    const statsMap: AuthorStatsMap = {};
    const result = classifyAllContributors(statsMap);
    expect(result).toEqual({});
  });
});
