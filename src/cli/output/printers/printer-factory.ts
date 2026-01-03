import type { AnalysisMode, PeriodUnit } from '@/core';
import { AggregatePrinter } from './aggregate-printer';
import { OwnershipPrinter } from './ownership-printer';
import { PeriodPrinter } from './period-printer';
import type { Printer } from './printer.interface';

/**
 * Factory for creating printers based on analysis mode
 */
export function createPrinter(
  mode: AnalysisMode,
  periodUnit: PeriodUnit = 'daily',
  directory?: string
): Printer {
  switch (mode) {
    case 'aggregate':
      return new AggregatePrinter();
    case 'periodic':
      return new PeriodPrinter(periodUnit);
    case 'ownership':
      return new OwnershipPrinter(directory);
    default:
      throw new Error(`Unknown analysis mode: ${mode}`);
  }
}
