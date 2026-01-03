import { describe, expect, test } from 'bun:test';
import type { CLIOptions } from '../types';
import { validateCLIOptions } from './cli-options-validator';

describe('validateCLIOptions', () => {
  describe('modeのバリデーション', () => {
    test('有効なmode（aggregate）を許可する', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });

    test('有効なmode（periodic）を許可する', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'periodic',
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });

    test('有効なmode（ownership）を許可する', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'ownership',
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });

    test('無効なmodeを拒否する', () => {
      // Arrange
      const options = {
        subcommand: 'summary' as const,
        mode: 'invalid-mode',
      } as unknown as CLIOptions;

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid --mode value');
        expect(result.error).toContain('invalid-mode');
      }
    });
  });

  describe('periodUnitのバリデーション', () => {
    test('有効なperiodUnit（daily）を許可する', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        periodUnit: 'daily',
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });

    test('有効なperiodUnit（weekly）を許可する', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        periodUnit: 'weekly',
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });

    test('有効なperiodUnit（monthly）を許可する', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        periodUnit: 'monthly',
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });

    test('無効なperiodUnitを拒否する', () => {
      // Arrange
      const options = {
        subcommand: 'summary' as const,
        mode: 'aggregate' as const,
        periodUnit: 'invalid-unit',
      } as unknown as CLIOptions;

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid --period-unit value');
        expect(result.error).toContain('invalid-unit');
      }
    });

    test('periodUnitが未指定の場合はエラーにならない', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('timeRangeのバリデーション', () => {
    test('sinceのみが指定されている場合を許可する', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        since: new Date('2024-01-01'),
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });

    test('untilのみが指定されている場合を許可する', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        until: new Date('2024-12-31'),
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });

    test('sinceとuntilの両方が指定されている場合を許可する（since < until）', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        since: new Date('2024-01-01'),
        until: new Date('2024-12-31'),
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });

    test('sinceがuntilより後の日付の場合を拒否する', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        since: new Date('2024-12-31'),
        until: new Date('2024-01-01'),
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('--since date must be before --until date');
      }
    });

    test('sinceとuntilが同じ日付の場合を許可する', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        since: new Date('2024-01-01'),
        until: new Date('2024-01-01'),
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('daysのバリデーション', () => {
    test('正の数のdaysを許可する', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        days: 30,
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });

    test('daysが1の場合を許可する', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        days: 1,
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });

    test('daysが0の場合を拒否する', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        days: 0,
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('--days must be a positive number');
      }
    });

    test('daysが負の数の場合を拒否する', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        days: -1,
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('--days must be a positive number');
      }
    });

    test('daysが未指定の場合はエラーにならない', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('複合的なバリデーション', () => {
    test('すべての有効なオプションを同時に指定できる', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'daily',
        mode: 'periodic',
        periodUnit: 'daily',
        days: 30,
        authors: ['John Doe', 'Jane Smith'],
        branch: 'main',
        minCommits: 5,
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });

    test('sinceとdaysを同時に指定できる（sinceが優先される）', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'summary',
        mode: 'aggregate',
        since: new Date('2024-01-01'),
        days: 30,
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });

    test('ownershipサブコマンドでexcludePatternsを指定できる', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'ownership',
        mode: 'ownership',
        excludePatterns: ['**/*.lock', '**/dist/**'],
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });

    test('ownershipサブコマンドでrespectGitignoreを指定できる', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'ownership',
        mode: 'ownership',
        respectGitignore: false,
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });

    test('ownershipサブコマンドでdirectoryを指定できる', () => {
      // Arrange
      const options: CLIOptions = {
        subcommand: 'ownership',
        mode: 'ownership',
        directory: 'packages/cli/src',
      };

      // Act
      const result = validateCLIOptions(options);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});
