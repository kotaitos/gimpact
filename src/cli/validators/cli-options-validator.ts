import { VALID_MODES, VALID_PERIOD_UNITS, validateTimeRange } from '@/core';
import type { CLIOptions } from '../types';

export interface ValidationError {
  success: false;
  error: string;
}

export interface ValidationSuccess {
  success: true;
}

export type ValidationResult = ValidationSuccess | ValidationError;

/**
 * Validate CLI options
 * @param options - Raw CLI options from commander
 * @returns Validation result
 */
export function validateCLIOptions(options: CLIOptions): ValidationResult {
  if (!VALID_MODES.includes(options.mode)) {
    return {
      success: false,
      error: `Invalid --mode value: ${options.mode}. Must be one of: ${VALID_MODES.join(', ')}`,
    };
  }

  if (options.periodUnit && !VALID_PERIOD_UNITS.includes(options.periodUnit)) {
    return {
      success: false,
      error: `Invalid --period-unit value: ${options.periodUnit}. Must be one of: ${VALID_PERIOD_UNITS.join(', ')}`,
    };
  }

  if (options.since || options.until) {
    try {
      validateTimeRange(options.since, options.until);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid time range',
      };
    }
  }

  if (options.days !== undefined && options.days <= 0) {
    return {
      success: false,
      error: '--days must be a positive number',
    };
  }

  return { success: true };
}
