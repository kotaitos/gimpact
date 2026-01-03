import type { AnalysisMode as AnalysisModeType } from '../../types';
import { AggregateMode } from './aggregate-mode';
import type { AnalysisMode } from './mode.interface';
import { OwnershipMode } from './ownership-mode';
import { PeriodicMode } from './periodic-mode';

/**
 * Mode registry for different analysis modes
 */
export const modeRegistry = new Map<AnalysisModeType, AnalysisMode>([
  ['aggregate', new AggregateMode()],
  ['periodic', new PeriodicMode()],
  ['ownership', new OwnershipMode()],
]);
