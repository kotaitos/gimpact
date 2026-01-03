import type { AnalysisMode } from '../types';

export const DEFAULT_MODE: AnalysisMode = 'aggregate';
export const VALID_MODES: AnalysisMode[] = ['aggregate', 'periodic', 'ownership'];
