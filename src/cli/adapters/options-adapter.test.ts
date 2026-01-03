import { describe, expect, test } from 'bun:test';
import { DEFAULT_DAYS } from '@/core';
import type { CLIOptions } from '../types';
import { adaptToAnalyzerOptions } from './options-adapter';

describe('adaptToAnalyzerOptions', () => {
  describe('サブコマンドからmodeとperiodUnitを決定', () => {
    test('summaryサブコマンドはaggregateモードになる', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.mode).toBe('aggregate');
      expect(result.periodUnit).toBeUndefined();
    });

    test('dailyサブコマンドはperiodicモードとdaily periodUnitになる', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'daily',
        mode: 'periodic',
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.mode).toBe('periodic');
      expect(result.periodUnit).toBe('daily');
    });

    test('weeklyサブコマンドはperiodicモードとweekly periodUnitになる', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'weekly',
        mode: 'periodic',
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.mode).toBe('periodic');
      expect(result.periodUnit).toBe('weekly');
    });

    test('monthlyサブコマンドはperiodicモードとmonthly periodUnitになる', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'monthly',
        mode: 'periodic',
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.mode).toBe('periodic');
      expect(result.periodUnit).toBe('monthly');
    });

    test('ownershipサブコマンドはownershipモードになる', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'ownership',
        mode: 'ownership',
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.mode).toBe('ownership');
      expect(result.periodUnit).toBeUndefined();
    });
  });

  describe('timeRangeの変換', () => {
    test('daysが指定されている場合、timeRange.daysに設定される', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        days: 30,
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.timeRange).toBeDefined();
      expect(result.timeRange!.days).toBe(30);
      expect(result.timeRange!.since).toBeUndefined();
      expect(result.timeRange!.until).toBeUndefined();
    });

    test('sinceが指定されている場合、timeRange.sinceに設定される', () => {
      // Arrange
      const sinceDate = new Date('2024-01-01');
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        since: sinceDate,
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.timeRange).toBeDefined();
      expect(result.timeRange!.since).toEqual(sinceDate);
      expect(result.timeRange!.days).toBeUndefined();
    });

    test('untilが指定されている場合、timeRange.untilに設定される', () => {
      // Arrange
      const untilDate = new Date('2024-12-31');
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        until: untilDate,
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.timeRange).toBeDefined();
      expect(result.timeRange!.until).toEqual(untilDate);
      expect(result.timeRange!.days).toBeUndefined();
    });

    test('sinceとuntilの両方が指定されている場合、両方が設定される', () => {
      // Arrange
      const sinceDate = new Date('2024-01-01');
      const untilDate = new Date('2024-12-31');
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        since: sinceDate,
        until: untilDate,
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.timeRange).toBeDefined();
      expect(result.timeRange!.since).toEqual(sinceDate);
      expect(result.timeRange!.until).toEqual(untilDate);
      expect(result.timeRange!.days).toBeUndefined();
    });

    test('sinceが指定されている場合、daysは無視される', () => {
      // Arrange
      const sinceDate = new Date('2024-01-01');
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        since: sinceDate,
        days: 30,
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.timeRange).toBeDefined();
      expect(result.timeRange!.since).toEqual(sinceDate);
      expect(result.timeRange!.days).toBeUndefined();
    });

    test('untilが指定されている場合、daysは無視される', () => {
      // Arrange
      const untilDate = new Date('2024-12-31');
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        until: untilDate,
        days: 30,
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.timeRange).toBeDefined();
      expect(result.timeRange!.until).toEqual(untilDate);
      expect(result.timeRange!.days).toBeUndefined();
    });

    test('timeRangeが指定されていない場合、デフォルトのdaysが設定される', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.timeRange).toBeDefined();
      expect(result.timeRange!.days).toBe(DEFAULT_DAYS);
      expect(result.timeRange!.since).toBeUndefined();
      expect(result.timeRange!.until).toBeUndefined();
    });
  });

  describe('authorsの変換', () => {
    test('authorsが指定されている場合、analyzerOptions.authorsに設定される', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        authors: ['John Doe', 'Jane Smith'],
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.authors).toEqual(['John Doe', 'Jane Smith']);
    });

    test('authorsが空配列の場合、analyzerOptions.authorsは設定されない', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        authors: [],
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.authors).toBeUndefined();
    });

    test('authorsが未指定の場合、analyzerOptions.authorsは設定されない', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.authors).toBeUndefined();
    });
  });

  describe('branchの変換', () => {
    test('branchが指定されている場合、analyzerOptions.branchに設定される', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        branch: 'main',
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.branch).toBe('main');
    });

    test('branchが未指定の場合、analyzerOptions.branchはundefined', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.branch).toBeUndefined();
    });
  });

  describe('minCommitsの変換', () => {
    test('minCommitsが指定されている場合、analyzerOptions.minCommitsに設定される', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        minCommits: 5,
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.minCommits).toBe(5);
    });

    test('minCommitsが0の場合、analyzerOptions.minCommitsに0が設定される', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        minCommits: 0,
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.minCommits).toBe(0);
    });

    test('minCommitsが未指定の場合、analyzerOptions.minCommitsは設定されない', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.minCommits).toBeUndefined();
    });
  });

  describe('ownership固有のオプション', () => {
    test('excludePatternsが指定されている場合、analyzerOptions.excludePatternsに設定される', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'ownership',
        mode: 'ownership',
        excludePatterns: ['**/*.lock', '**/dist/**'],
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.excludePatterns).toEqual(['**/*.lock', '**/dist/**']);
    });

    test('excludePatternsが空配列の場合、analyzerOptions.excludePatternsは設定されない', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'ownership',
        mode: 'ownership',
        excludePatterns: [],
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.excludePatterns).toBeUndefined();
    });

    test('respectGitignoreがfalseの場合、analyzerOptions.respectGitignoreにfalseが設定される', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'ownership',
        mode: 'ownership',
        respectGitignore: false,
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.respectGitignore).toBe(false);
    });

    test('respectGitignoreがtrueの場合、analyzerOptions.respectGitignoreにtrueが設定される', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'ownership',
        mode: 'ownership',
        respectGitignore: true,
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.respectGitignore).toBe(true);
    });

    test('respectGitignoreが未指定の場合、analyzerOptions.respectGitignoreは設定されない', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'ownership',
        mode: 'ownership',
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.respectGitignore).toBeUndefined();
    });

    test('directoryが指定されている場合、analyzerOptions.directoryに設定される', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'ownership',
        mode: 'ownership',
        directory: 'packages/cli/src',
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.directory).toBe('packages/cli/src');
    });

    test('directoryが未指定の場合、analyzerOptions.directoryは設定されない', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'ownership',
        mode: 'ownership',
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.directory).toBeUndefined();
    });
  });

  describe('複合的なオプション変換', () => {
    test('すべてのオプションが指定されている場合、すべてが正しく変換される', () => {
      // Arrange
      const sinceDate = new Date('2024-01-01');
      const untilDate = new Date('2024-12-31');
      const options: CLIOptions = {
        subcommand: 'daily',
        mode: 'periodic',
        since: sinceDate,
        until: untilDate,
        authors: ['John Doe', 'Jane Smith'],
        branch: 'main',
        minCommits: 5,
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.mode).toBe('periodic');
      expect(result.periodUnit).toBe('daily');
      expect(result.timeRange).toBeDefined();
      expect(result.timeRange!.since).toEqual(sinceDate);
      expect(result.timeRange!.until).toEqual(untilDate);
      expect(result.authors).toEqual(['John Doe', 'Jane Smith']);
      expect(result.branch).toBe('main');
      expect(result.minCommits).toBe(5);
    });

    test('ownershipサブコマンドでownership固有のオプションがすべて設定される', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'ownership',
        mode: 'ownership',
        excludePatterns: ['**/*.lock'],
        respectGitignore: false,
        directory: 'src',
      };

      // Act
      const result = adaptToAnalyzerOptions(options);

      // Assert
      expect(result.mode).toBe('ownership');
      expect(result.excludePatterns).toEqual(['**/*.lock']);
      expect(result.respectGitignore).toBe(false);
      expect(result.directory).toBe('src');
    });
  });
});
