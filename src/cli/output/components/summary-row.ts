import chalk from 'chalk';

export interface SummaryData {
  totalCommits: number;
  totalInsertions: number;
  totalDeletions: number;
  totalFiles?: number;
  timeRangeDescription: string;
  additionalInfo?: string;
}

export function createSummaryRow(data: SummaryData): string[] {
  const row = [
    chalk.bold(`📊 Total (${data.timeRangeDescription})`),
    chalk.bold(chalk.cyan(data.totalCommits.toString())),
    chalk.bold(chalk.green(`+${data.totalInsertions.toLocaleString()}`)),
    chalk.bold(chalk.red(`-${data.totalDeletions.toLocaleString()}`)),
  ];

  if (data.totalFiles !== undefined) {
    row.push(chalk.bold(chalk.blue(data.totalFiles.toString())));
  }

  if (data.additionalInfo) {
    row.push(chalk.bold(chalk.yellow(data.additionalInfo)));
  }

  return row;
}
