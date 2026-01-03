import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  daysAgo,
  formatDateForDisplay,
  formatDateForGit,
  getMonthIdentifier,
  getWeekNumber,
  validateTimeRange,
} from './index';

describe('date-utils', () => {
  describe('daysAgo', () => {
    /**
     * Equivalence partitioning:
     * - Valid class: positive integers (1 day ago, multiple days ago)
     * - Boundary values: 0 days ago (today), 1 day ago, large values (year crossing)
     */

    test('returns today when 0 days ago', () => {
      // Arrange
      const daysToSubtract = 0;
      const today = new Date();

      // Act
      const result = daysAgo(daysToSubtract);

      // Assert
      expect(result.getFullYear()).toBe(today.getFullYear());
      expect(result.getMonth()).toBe(today.getMonth());
      expect(result.getDate()).toBe(today.getDate());
    });

    test('calculates 1 day ago correctly', () => {
      // Arrange
      const daysToSubtract = 1;
      const expected = new Date();
      expected.setDate(expected.getDate() - 1);

      // Act
      const result = daysAgo(daysToSubtract);

      // Assert
      expect(result.getFullYear()).toBe(expected.getFullYear());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getDate()).toBe(expected.getDate());
    });

    test('calculates 30 days ago correctly', () => {
      // Arrange
      const daysToSubtract = 30;
      const expected = new Date();
      expected.setDate(expected.getDate() - 30);

      // Act
      const result = daysAgo(daysToSubtract);

      // Assert
      expect(result.getFullYear()).toBe(expected.getFullYear());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getDate()).toBe(expected.getDate());
    });

    test('calculates 365 days ago correctly (year crossing)', () => {
      // Arrange
      const daysToSubtract = 365;
      const expected = new Date();
      expected.setDate(expected.getDate() - 365);

      // Act
      const result = daysAgo(daysToSubtract);

      // Assert
      expect(result.getFullYear()).toBe(expected.getFullYear());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getDate()).toBe(expected.getDate());
    });

    test('handles month crossing correctly', () => {
      // Arrange
      const daysToSubtract = 31;
      const expected = new Date();
      expected.setDate(expected.getDate() - 31);

      // Act
      const result = daysAgo(daysToSubtract);

      // Assert
      expect(result.getFullYear()).toBe(expected.getFullYear());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getDate()).toBe(expected.getDate());
    });
  });

  describe('formatDateForGit', () => {
    /**
     * Equivalence partitioning:
     * - Normal dates
     * - Single-digit months/days (zero-padding check)
     * - Year-end/year-start boundaries
     */

    test('formats normal date as YYYY-MM-DD', () => {
      // Arrange
      const date = new Date('2025-12-15T10:30:00');

      // Act
      const result = formatDateForGit(date);

      // Assert
      expect(result).toBe('2025-12-15');
    });

    test('zero-pads single-digit month', () => {
      // Arrange
      const date = new Date('2025-01-15T10:30:00');

      // Act
      const result = formatDateForGit(date);

      // Assert
      expect(result).toBe('2025-01-15');
    });

    test('zero-pads single-digit day', () => {
      // Arrange
      const date = new Date('2025-12-05T10:30:00');

      // Act
      const result = formatDateForGit(date);

      // Assert
      expect(result).toBe('2025-12-05');
    });

    test('formats year-end date correctly', () => {
      // Arrange
      const date = new Date('2025-12-31T23:59:59');

      // Act
      const result = formatDateForGit(date);

      // Assert
      expect(result).toBe('2025-12-31');
    });

    test('formats year-start date correctly', () => {
      // Arrange
      const date = new Date('2025-01-01T00:00:00');

      // Act
      const result = formatDateForGit(date);

      // Assert
      expect(result).toBe('2025-01-01');
    });
  });

  describe('formatDateForDisplay', () => {
    /**
     * Same specification as formatDateForGit, only representative case
     */

    test('formats date as YYYY-MM-DD', () => {
      // Arrange
      const date = new Date('2025-06-20T15:45:00');

      // Act
      const result = formatDateForDisplay(date);

      // Assert
      expect(result).toBe('2025-06-20');
    });
  });

  describe('getWeekNumber', () => {
    /**
     * Equivalence partitioning for ISO 8601 week number:
     * - First week of year (W01)
     * - Last week of year (W52 or W53)
     * - Year-crossing boundary (Dec 31 belonging to next year's W01)
     * - Normal weeks
     *
     * Boundary values:
     * - January 1 (W52/W53/W01 depending on year)
     * - December 31 (W01/W52/W53 depending on year)
     * - First (Monday) and last (Sunday) day of week
     */

    test('Jan 1, 2025 is 2025-W01 (Wednesday, mid-week)', () => {
      // Arrange
      const date = new Date('2025-01-01');

      // Act
      const result = getWeekNumber(date);

      // Assert
      expect(result).toBe('2025-W01');
    });

    test('Dec 31, 2025 is 2026-W01 (belongs to next year first week)', () => {
      // Arrange
      const date = new Date('2025-12-31');

      // Act
      const result = getWeekNumber(date);

      // Assert
      expect(result).toBe('2026-W01');
    });

    test('Dec 29, 2025 is 2026-W01 (Monday, new week start)', () => {
      // Arrange
      const date = new Date('2025-12-29');

      // Act
      const result = getWeekNumber(date);

      // Assert
      expect(result).toBe('2026-W01');
    });

    test('Dec 28, 2025 is 2025-W52 (Sunday, last week of 2025)', () => {
      // Arrange
      const date = new Date('2025-12-28');

      // Act
      const result = getWeekNumber(date);

      // Assert
      expect(result).toBe('2025-W52');
    });

    test('Dec 30, 2024 belongs to 2025-W01', () => {
      // Arrange
      const date = new Date('2024-12-30');

      // Act
      const result = getWeekNumber(date);

      // Assert
      expect(result).toBe('2025-W01');
    });

    test('Dec 29, 2024 belongs to 2024-W52', () => {
      // Arrange
      const date = new Date('2024-12-29');

      // Act
      const result = getWeekNumber(date);

      // Assert
      expect(result).toBe('2024-W52');
    });

    test('returns correct week number for normal date (Jun 15, 2025)', () => {
      // Arrange
      const date = new Date('2025-06-15');

      // Act
      const result = getWeekNumber(date);

      // Assert
      expect(result).toBe('2025-W24');
    });

    test('zero-pads single-digit week number', () => {
      // Arrange
      const date = new Date('2025-01-06'); // W02

      // Act
      const result = getWeekNumber(date);

      // Assert
      expect(result).toBe('2025-W02');
    });

    test('displays double-digit week number as is', () => {
      // Arrange
      const date = new Date('2025-03-17'); // W12

      // Act
      const result = getWeekNumber(date);

      // Assert
      expect(result).toBe('2025-W12');
    });

    test('handles year with 53 weeks (Dec 31, 2020)', () => {
      // Arrange
      const date = new Date('2020-12-31');

      // Act
      const result = getWeekNumber(date);

      // Assert
      expect(result).toBe('2020-W53');
    });
  });

  describe('getMonthIdentifier', () => {
    /**
     * Equivalence partitioning:
     * - Single-digit months (01-09)
     * - Double-digit months (10-12)
     * - Year boundaries (December, January)
     */

    test('zero-pads single-digit month (January)', () => {
      // Arrange
      const date = new Date('2025-01-15');

      // Act
      const result = getMonthIdentifier(date);

      // Assert
      expect(result).toBe('2025-01');
    });

    test('zero-pads single-digit month (September)', () => {
      // Arrange
      const date = new Date('2025-09-20');

      // Act
      const result = getMonthIdentifier(date);

      // Assert
      expect(result).toBe('2025-09');
    });

    test('displays double-digit month as is (October)', () => {
      // Arrange
      const date = new Date('2025-10-10');

      // Act
      const result = getMonthIdentifier(date);

      // Assert
      expect(result).toBe('2025-10');
    });

    test('displays double-digit month as is (December)', () => {
      // Arrange
      const date = new Date('2025-12-25');

      // Act
      const result = getMonthIdentifier(date);

      // Assert
      expect(result).toBe('2025-12');
    });

    test('returns correct month for first day of month', () => {
      // Arrange
      const date = new Date('2025-03-01');

      // Act
      const result = getMonthIdentifier(date);

      // Assert
      expect(result).toBe('2025-03');
    });

    test('returns correct month for last day of month', () => {
      // Arrange
      const date = new Date('2025-02-28');

      // Act
      const result = getMonthIdentifier(date);

      // Assert
      expect(result).toBe('2025-02');
    });
  });

  describe('validateTimeRange', () => {
    /**
     * Equivalence partitioning:
     * - Valid: since < until, since only, until only, both undefined
     * - Invalid: since > until, since in future, until in future
     *
     * Boundary values:
     * - since === until (same day)
     * - today's date (future boundary)
     */

    let originalDate: typeof Date;
    const fixedNow = new Date('2025-06-15T12:00:00Z');

    beforeEach(() => {
      originalDate = global.Date;
      global.Date = class extends Date {
        constructor(...args: Parameters<typeof Date>) {
          if (args.length === 0) {
            super(fixedNow);
          } else {
            super(...args);
          }
        }
      } as typeof Date;
    });

    afterEach(() => {
      global.Date = originalDate;
    });

    test('does not throw when both undefined', () => {
      // Arrange
      const since = undefined;
      const until = undefined;

      // Act & Assert
      expect(() => validateTimeRange(since, until)).not.toThrow();
    });

    test('does not throw when only since is specified (past)', () => {
      // Arrange
      const since = new Date('2025-01-01');
      const until = undefined;

      // Act & Assert
      expect(() => validateTimeRange(since, until)).not.toThrow();
    });

    test('does not throw when only until is specified (past)', () => {
      // Arrange
      const since = undefined;
      const until = new Date('2025-06-01');

      // Act & Assert
      expect(() => validateTimeRange(since, until)).not.toThrow();
    });

    test('does not throw when since < until', () => {
      // Arrange
      const since = new Date('2025-01-01');
      const until = new Date('2025-06-01');

      // Act & Assert
      expect(() => validateTimeRange(since, until)).not.toThrow();
    });

    test('does not throw when since === until (same day)', () => {
      // Arrange
      const since = new Date('2025-03-15');
      const until = new Date('2025-03-15');

      // Act & Assert
      expect(() => validateTimeRange(since, until)).not.toThrow();
    });

    test('throws error when since > until', () => {
      // Arrange
      const since = new Date('2025-06-01');
      const until = new Date('2025-01-01');

      // Act & Assert
      expect(() => validateTimeRange(since, until)).toThrow(
        '--since date must be before --until date'
      );
    });

    test('throws error when since is in the future', () => {
      // Arrange
      const since = new Date('2025-12-01'); // After fixed now (2025-06-15)
      const until = undefined;

      // Act & Assert
      expect(() => validateTimeRange(since, until)).toThrow('--since date cannot be in the future');
    });

    test('throws error when until is in the future', () => {
      // Arrange
      const since = undefined;
      const until = new Date('2025-12-01'); // After fixed now (2025-06-15)

      // Act & Assert
      expect(() => validateTimeRange(since, until)).toThrow('--until date cannot be in the future');
    });

    test('does not throw when since is today (boundary value)', () => {
      // Arrange
      const since = new Date('2025-06-15T00:00:00Z'); // Same as fixed now
      const until = undefined;

      // Act & Assert
      expect(() => validateTimeRange(since, until)).not.toThrow();
    });
  });
});
