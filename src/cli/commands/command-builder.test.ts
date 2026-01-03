import { describe, expect, test } from 'bun:test';
import { createCommand, parseArgs } from './command-builder';

describe('command-builder', () => {
  describe('parseArgs', () => {
    test('デフォルトでsummaryサブコマンドとしてパースされる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.subcommand).toBe('summary');
      expect(result.mode).toBe('aggregate'); // デフォルト値が設定される
      expect(result.days).toBeUndefined();

      // Cleanup
      process.argv = originalArgv;
    });

    test('summaryサブコマンドを明示的に指定できる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', 'summary'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.subcommand).toBe('summary');

      // Cleanup
      process.argv = originalArgv;
    });

    test('dailyサブコマンドをパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', 'daily'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.subcommand).toBe('daily');

      // Cleanup
      process.argv = originalArgv;
    });

    test('weeklyサブコマンドをパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', 'weekly'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.subcommand).toBe('weekly');

      // Cleanup
      process.argv = originalArgv;
    });

    test('monthlyサブコマンドをパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', 'monthly'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.subcommand).toBe('monthly');

      // Cleanup
      process.argv = originalArgv;
    });

    test('ownershipサブコマンドをパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', 'ownership'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.subcommand).toBe('ownership');

      // Cleanup
      process.argv = originalArgv;
    });

    test('--daysオプションをパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', '--days', '30'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.days).toBe(30);

      // Cleanup
      process.argv = originalArgv;
    });

    test('-dオプション（daysの短縮形）をパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', '-d', '7'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.days).toBe(7);

      // Cleanup
      process.argv = originalArgv;
    });

    test('--sinceオプションをパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', '--since', '2024-01-01'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.since).toBeInstanceOf(Date);
      expect(result.since?.toISOString().split('T')[0]).toBe('2024-01-01');

      // Cleanup
      process.argv = originalArgv;
    });

    test('-sオプション（sinceの短縮形）をパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', '-s', '2024-01-15'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.since).toBeInstanceOf(Date);
      expect(result.since?.toISOString().split('T')[0]).toBe('2024-01-15');

      // Cleanup
      process.argv = originalArgv;
    });

    test('--untilオプションをパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', '--until', '2024-12-31'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.until).toBeInstanceOf(Date);
      expect(result.until?.toISOString().split('T')[0]).toBe('2024-12-31');

      // Cleanup
      process.argv = originalArgv;
    });

    test('-uオプション（untilの短縮形）をパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', '-u', '2024-06-30'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.until).toBeInstanceOf(Date);
      expect(result.until?.toISOString().split('T')[0]).toBe('2024-06-30');

      // Cleanup
      process.argv = originalArgv;
    });

    test('--modeオプションをパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', '--mode', 'periodic'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.mode).toBe('periodic');

      // Cleanup
      process.argv = originalArgv;
    });

    test('-mオプション（modeの短縮形）をパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', '-m', 'aggregate'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.mode).toBe('aggregate');

      // Cleanup
      process.argv = originalArgv;
    });

    test('--period-unitオプションをパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', '--period-unit', 'weekly'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.periodUnit).toBe('weekly');

      // Cleanup
      process.argv = originalArgv;
    });

    test('-pオプション（period-unitの短縮形）をパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', '-p', 'monthly'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.periodUnit).toBe('monthly');

      // Cleanup
      process.argv = originalArgv;
    });

    test('--authorsオプションをパースできる（単一の著者）', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', '--authors', 'John Doe'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.authors).toEqual(['John Doe']);

      // Cleanup
      process.argv = originalArgv;
    });

    test('-aオプション（authorsの短縮形）をパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', '-a', 'Jane Smith'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.authors).toEqual(['Jane Smith']);

      // Cleanup
      process.argv = originalArgv;
    });

    test('--authorsオプションで複数の著者をパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', '--authors', 'John Doe', 'Jane Smith', 'Bob Wilson'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.authors).toEqual(['John Doe', 'Jane Smith', 'Bob Wilson']);

      // Cleanup
      process.argv = originalArgv;
    });

    test('--branchオプションをパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', '--branch', 'main'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.branch).toBe('main');

      // Cleanup
      process.argv = originalArgv;
    });

    test('-bオプション（branchの短縮形）をパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', '-b', 'develop'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.branch).toBe('develop');

      // Cleanup
      process.argv = originalArgv;
    });

    test('--min-commitsオプションをパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', '--min-commits', '5'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.minCommits).toBe(5);

      // Cleanup
      process.argv = originalArgv;
    });

    test('-cオプション（min-commitsの短縮形）をパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', '-c', '10'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.minCommits).toBe(10);

      // Cleanup
      process.argv = originalArgv;
    });

    test('ownershipサブコマンドで--exclude-patternsオプションをパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = [
        'node',
        'gimpact',
        'ownership',
        '--exclude-patterns',
        '**/*.lock',
        '**/dist/**',
      ];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.subcommand).toBe('ownership');
      expect(result.excludePatterns).toEqual(['**/*.lock', '**/dist/**']);

      // Cleanup
      process.argv = originalArgv;
    });

    test('ownershipサブコマンドで--no-respect-gitignoreオプションをパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', 'ownership', '--no-respect-gitignore'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.subcommand).toBe('ownership');
      expect(result.respectGitignore).toBe(false);

      // Cleanup
      process.argv = originalArgv;
    });

    test('ownershipサブコマンドで--directoryオプションをパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', 'ownership', '--directory', 'packages/cli/src'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.subcommand).toBe('ownership');
      expect(result.directory).toBe('packages/cli/src');

      // Cleanup
      process.argv = originalArgv;
    });

    test('複数のオプションを同時にパースできる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = [
        'node',
        'gimpact',
        'daily',
        '--days',
        '14',
        '--authors',
        'John Doe',
        'Jane Smith',
        '--branch',
        'feature-branch',
        '--min-commits',
        '3',
      ];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.subcommand).toBe('daily');
      expect(result.days).toBe(14);
      expect(result.authors).toEqual(['John Doe', 'Jane Smith']);
      expect(result.branch).toBe('feature-branch');
      expect(result.minCommits).toBe(3);

      // Cleanup
      process.argv = originalArgv;
    });

    test('sinceとuntilを同時に指定できる', () => {
      // Arrange
      const program = createCommand();
      const originalArgv = process.argv;
      process.argv = ['node', 'gimpact', '--since', '2024-01-01', '--until', '2024-12-31'];

      // Act
      const result = parseArgs(program);

      // Assert
      expect(result.since).toBeInstanceOf(Date);
      expect(result.until).toBeInstanceOf(Date);
      expect(result.since?.toISOString().split('T')[0]).toBe('2024-01-01');
      expect(result.until?.toISOString().split('T')[0]).toBe('2024-12-31');

      // Cleanup
      process.argv = originalArgv;
    });
  });
});
