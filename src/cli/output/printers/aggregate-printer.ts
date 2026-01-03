import chalk from 'chalk';
import type { AggregateAnalysisResult, AuthorStatsMap } from '@/core';
import { createSummaryRow, createTable, renderBar } from '../components';
import type { Printer } from './printer.interface';

export class AggregatePrinter implements Printer {
  print(result: AggregateAnalysisResult, timeRangeDescription: string): void {
    this.printAggregateStats(result.stats, timeRangeDescription);
    this.printEfficiencyAnalysis(result.efficiency);
  }

  private printAggregateStats(stats: AuthorStatsMap, timeRangeDescription: string): void {
    // Sort by total impact (insertions + deletions) in descending order
    const sortedAuthors = Object.entries(stats).sort((a, b) => {
      const impactA = a[1].insertions + a[1].deletions;
      const impactB = b[1].insertions + b[1].deletions;
      return impactB - impactA;
    });

    if (sortedAuthors.length === 0) {
      console.log(chalk.yellow(`\n⚠ No commits found in the specified time range.\n`));
      return;
    }

    const table = createTable({
      head: [
        chalk.bold('Author'),
        chalk.bold('Commits'),
        chalk.bold('Insertions'),
        chalk.bold('Deletions'),
        chalk.bold('Files'),
      ],
      colAligns: ['left', 'right', 'right', 'right', 'right'],
    });

    // Calculate totals
    const totalCommits = sortedAuthors.reduce((sum, [, data]) => sum + data.commits, 0);
    const totalInsertions = sortedAuthors.reduce((sum, [, data]) => sum + data.insertions, 0);
    const totalDeletions = sortedAuthors.reduce((sum, [, data]) => sum + data.deletions, 0);
    const totalFiles = sortedAuthors.reduce((sum, [, data]) => sum + data.filesTouched, 0);

    for (const [author, data] of sortedAuthors) {
      table.push([
        author,
        chalk.white(data.commits.toString()),
        chalk.green(`+${data.insertions.toLocaleString()}`),
        chalk.red(`-${data.deletions.toLocaleString()}`),
        chalk.blue(data.filesTouched.toString()),
      ]);
    }

    // Add summary row
    table.push(
      createSummaryRow({
        totalCommits,
        totalInsertions,
        totalDeletions,
        totalFiles,
        timeRangeDescription,
      })
    );

    console.log(`\n${table.toString()}\n`);
  }

  private printEfficiencyAnalysis(efficiency: AggregateAnalysisResult['efficiency']): void {
    const authors = Object.keys(efficiency);

    if (authors.length === 0) {
      return;
    }

    // Aggregate all authors' distributions
    const totalDist = {
      micro: 0,
      small: 0,
      optimal: 0,
      high: 0,
      huge: 0,
    };
    let totalCommits = 0;
    let totalLines = 0;

    for (const author of authors) {
      const stats = efficiency[author];
      totalDist.micro += stats.distribution.micro;
      totalDist.small += stats.distribution.small;
      totalDist.optimal += stats.distribution.optimal;
      totalDist.high += stats.distribution.high;
      totalDist.huge += stats.distribution.huge;
      totalCommits += stats.totalCommits;
      totalLines += stats.efficiency * stats.totalCommits;
    }

    const avgEfficiency = totalCommits > 0 ? Math.round(totalLines / totalCommits) : 0;

    console.log(chalk.bold.cyan('⚡ Commit Size Distribution (All Authors)'));
    console.log(chalk.dim(`   Average: ${avgEfficiency} lines/commit`));
    console.log(chalk.dim(`   Total: ${totalCommits} commits\n`));

    const maxCount = Math.max(
      totalDist.micro,
      totalDist.small,
      totalDist.optimal,
      totalDist.high,
      totalDist.huge
    );
    const maxBarWidth = 30;

    // Define bucket display info
    const buckets: Array<{
      label: string;
      range: string;
      count: number;
      indicator: string;
      color: (s: string) => string;
    }> = [
      {
        label: 'Micro',
        range: '0-10',
        count: totalDist.micro,
        indicator: '🟡',
        color: chalk.yellow,
      },
      {
        label: 'Small',
        range: '11-30',
        count: totalDist.small,
        indicator: '🟡',
        color: chalk.yellow,
      },
      {
        label: 'Optimal',
        range: '31-150',
        count: totalDist.optimal,
        indicator: '✅',
        color: chalk.green,
      },
      {
        label: 'High',
        range: '151-500',
        count: totalDist.high,
        indicator: '⚠️',
        color: chalk.hex('#FFA500'),
      },
      { label: 'Huge', range: '500+', count: totalDist.huge, indicator: '🚨', color: chalk.red },
    ];

    for (const bucket of buckets) {
      const bar = renderBar(bucket.count, maxCount, maxBarWidth);
      const paddedRange = bucket.range.padStart(7);
      const countStr = bucket.count.toString().padStart(3);
      console.log(
        chalk.gray(`   ${paddedRange}  `) +
          bucket.color(bar.padEnd(maxBarWidth)) +
          chalk.gray(` ${countStr} `) +
          bucket.indicator
      );
    }

    console.log('');
  }
}
