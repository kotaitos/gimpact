import type { AnalysisMode, PeriodUnit } from '@/core';
import type { Subcommand } from '../types';

/**
 * Subcommand to analysis mode mapping
 */
export const subcommandToMode: Record<Subcommand, { mode: AnalysisMode; periodUnit?: PeriodUnit }> =
  {
    summary: { mode: 'aggregate' },
    daily: { mode: 'periodic', periodUnit: 'daily' },
    weekly: { mode: 'periodic', periodUnit: 'weekly' },
    monthly: { mode: 'periodic', periodUnit: 'monthly' },
    ownership: { mode: 'ownership' },
  };
