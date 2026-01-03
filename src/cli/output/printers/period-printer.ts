import chalk from 'chalk';
import type { PeriodAuthorStatsArray, PeriodUnit } from '@/core';
import { createSummaryRow, createTable } from '../components';
import type { Printer } from './printer.interface';

export class PeriodPrinter implements Printer {
  constructor(private periodUnit: PeriodUnit) {}

  print(result: PeriodAuthorStatsArray, timeRangeDescription: string): void {
    if (result.length === 0) {
      console.log(chalk.yellow(`\n⚠ No commits found in the specified time range.\n`));
      return;
    }

    const periodLabel =
      this.periodUnit === 'daily' ? 'Date' : this.periodUnit === 'weekly' ? 'Week' : 'Month';

    const table = createTable({
      head: [
        chalk.bold(periodLabel),
        chalk.bold('Author'),
        chalk.bold('Commits'),
        chalk.bold('Insertions'),
        chalk.bold('Deletions'),
        chalk.bold('Total Impact'),
      ],
      colAligns: ['left', 'left', 'right', 'right', 'right', 'right'],
    });

    // Calculate totals
    const uniqueAuthors = new Set(result.map((s) => s.author)).size;
    const uniquePeriods = new Set(result.map((s) => s.period)).size;
    const totalCommits = result.reduce((sum, s) => sum + s.stats.commits, 0);
    const totalInsertions = result.reduce((sum, s) => sum + s.stats.insertions, 0);
    const totalDeletions = result.reduce((sum, s) => sum + s.stats.deletions, 0);

    for (const item of result) {
      const totalImpact = item.stats.insertions + item.stats.deletions;

      table.push([
        chalk.cyan(item.period),
        item.author,
        chalk.white(item.stats.commits.toString()),
        chalk.green(`+${item.stats.insertions.toLocaleString()}`),
        chalk.red(`-${item.stats.deletions.toLocaleString()}`),
        chalk.bold(totalImpact.toLocaleString()),
      ]);
    }

    // Add summary row
    table.push(
      createSummaryRow({
        totalCommits,
        totalInsertions,
        totalDeletions,
        timeRangeDescription,
        additionalInfo: `${uniqueAuthors} authors / ${uniquePeriods} ${periodLabel.toLowerCase()}s`,
      })
    );

    console.log(`\n${table.toString()}\n`);
  }
}
