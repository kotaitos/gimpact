/**
 * Validate time range configuration
 * @throws {Error} If since > until or dates are in the future
 */
export function validateTimeRange(since?: Date, until?: Date): void {
  if (since && until && since > until) {
    throw new Error('--since date must be before --until date');
  }

  const now = new Date();
  if (since && since > now) {
    throw new Error('--since date cannot be in the future');
  }
  if (until && until > now) {
    throw new Error('--until date cannot be in the future');
  }
}
