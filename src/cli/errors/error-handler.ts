import chalk from 'chalk';

/**
 * Handle and display errors
 */
export function handleError(error: unknown): void {
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  console.error(chalk.red(message));
}
