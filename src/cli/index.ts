#!/usr/bin/env node

import * as p from '@clack/prompts';
import chalk from 'chalk';
import { analyzeContributions } from '@/core';
import { buildTimeRangeDescription, mapToAnalyzerOptions } from './commands/utils';
import { createCommand, parseArgs } from './commands';
import { createPrinter } from './output';
import type { CLIOptions } from './types';
import { validateCLIOptions } from './validators';

async function main() {
  const program = createCommand();
  const rawOptions = parseArgs(program);
  const options: CLIOptions = {
    ...rawOptions,
    mode: rawOptions.mode || 'aggregate',
  };

  // Validate CLI options
  const validationResult = validateCLIOptions(options);

  if (!validationResult.success) {
    console.error(chalk.red(validationResult.error));
    process.exit(1);
  }

  // Adapt to analyzer options
  const analyzerOptions = mapToAnalyzerOptions(options);
  const timeRangeDescription = buildTimeRangeDescription(options);

  p.intro(chalk.bgCyan(chalk.black(' gimpact ')));

  const s = p.spinner();
  s.start('Analyzing Git repository...');

  try {
    const stats = await analyzeContributions(analyzerOptions);
    s.stop('Analysis complete!');

    const printer = createPrinter(
      analyzerOptions.mode || 'aggregate',
      analyzerOptions.periodUnit,
      analyzerOptions.directory
    );
    printer.print(stats, timeRangeDescription);

    p.outro(chalk.green('✓ Done!'));
  } catch (error) {
    s.stop('Analysis failed');
    p.cancel(chalk.red(error instanceof Error ? error.message : 'Unknown error occurred'));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
