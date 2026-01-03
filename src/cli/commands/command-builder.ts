import { Command } from 'commander';
import { DEFAULT_DAYS, VALID_MODES, VALID_PERIOD_UNITS } from '@/core';

function addCommonOptions(command: Command): Command {
  return command
    .option('-d, --days <number>', `number of days to analyze (default: ${DEFAULT_DAYS})`, (val) =>
      parseInt(val, 10)
    )
    .option('-s, --since <date>', 'start date (YYYY-MM-DD)', (val) => new Date(val))
    .option('-u, --until <date>', 'end date (YYYY-MM-DD)', (val) => new Date(val))
    .option(
      '-a, --authors <names...>',
      'filter by specific author names (can specify multiple). Enables deep-dive stability analysis'
    )
    .option('-b, --branch <name>', 'analyze specific branch (default: current branch)')
    .option(
      '-c, --min-commits <number>',
      'minimum number of commits to include an author (default: 1)',
      (val) => parseInt(val, 10)
    );
}

export function createCommand(): Command {
  const program = new Command();

  program
    .name('gimpact')
    .description('Visualize Git contribution impact by developer')
    .version('0.1.0')
    .option('-d, --days <number>', `number of days to analyze (default: ${DEFAULT_DAYS})`, (val) =>
      parseInt(val, 10)
    )
    .option('-s, --since <date>', 'start date (YYYY-MM-DD)', (val) => new Date(val))
    .option('-u, --until <date>', 'end date (YYYY-MM-DD)', (val) => new Date(val))
    .option(
      '-m, --mode <type>',
      `analysis mode: ${VALID_MODES.join(', ')} (default: aggregate)`,
      'aggregate'
    )
    .option(
      '-p, --period-unit <type>',
      `period unit for periodic mode: ${VALID_PERIOD_UNITS.join(', ')} (default: daily)`,
      'daily'
    )
    .option(
      '-a, --authors <names...>',
      'filter by specific author names (can specify multiple). Enables deep-dive stability analysis'
    )
    .option('-b, --branch <name>', 'analyze specific branch (default: current branch)')
    .option(
      '-c, --min-commits <number>',
      'minimum number of commits to include an author (default: 1)',
      (val) => parseInt(val, 10)
    )
    .action(() => {
      // Default action: treat as 'summary' subcommand
      // This allows the main command to work without explicitly specifying 'summary'
    });

  // Summary subcommand (default aggregate mode)
  addCommonOptions(
    program.command('summary').description('Show aggregate report with all analyses (default)')
  ).action(() => {
    // Action handled in parseArgs
  });

  // Daily subcommand
  addCommonOptions(program.command('daily').description('Show daily periodic report')).action(
    () => {
      // Action handled in parseArgs
    }
  );

  // Weekly subcommand
  addCommonOptions(program.command('weekly').description('Show weekly periodic report')).action(
    () => {
      // Action handled in parseArgs
    }
  );

  // Monthly subcommand
  addCommonOptions(program.command('monthly').description('Show monthly periodic report')).action(
    () => {
      // Action handled in parseArgs
    }
  );

  // Ownership subcommand
  addCommonOptions(
    program
      .command('ownership')
      .description('Show code ownership analysis (files, directories, authors)')
      .option(
        '--exclude-patterns <patterns...>',
        'additional glob patterns to exclude from analysis (e.g., "**/*.lock" "**/dist/**")'
      )
      .option(
        '--no-respect-gitignore',
        'include files that are ignored by .gitignore (default: respect .gitignore)'
      )
      .option(
        '--directory <path>',
        'filter by directory path (only include files in this directory, e.g., "packages/cli/src")'
      )
  ).action(() => {
    // Action handled in parseArgs
  });

  return program;
}

export function parseArgs(program: Command) {
  program.parse(process.argv);
  const args = program.args;

  // Determine subcommand from parsed command
  // When a subcommand is used, args[0] contains the subcommand name
  // Default to 'summary' if no subcommand is specified
  let subcommand: 'summary' | 'daily' | 'weekly' | 'monthly' | 'ownership' = 'summary';
  if (args.length > 0 && args[0]) {
    const validSubcommands: ('summary' | 'daily' | 'weekly' | 'monthly' | 'ownership')[] = [
      'summary',
      'daily',
      'weekly',
      'monthly',
      'ownership',
    ];
    if (
      validSubcommands.includes(args[0] as 'summary' | 'daily' | 'weekly' | 'monthly' | 'ownership')
    ) {
      subcommand = args[0] as 'summary' | 'daily' | 'weekly' | 'monthly' | 'ownership';
    }
  }

  // Get options from the selected subcommand if available, otherwise from main program
  // Find the subcommand and get its options
  const subcommandCommand =
    subcommand !== 'summary' ? program.commands.find((cmd) => cmd.name() === subcommand) : null;

  // Get options from subcommand if it exists, otherwise from main program
  // Note: When a subcommand is used, Commander.js merges parent and subcommand options
  // So we need to check both the subcommand and the main program
  const mainOpts = program.opts();
  const subOpts = subcommandCommand ? subcommandCommand.opts() : {};
  // Merge options: subcommand options take precedence, but fall back to main program options
  const opts = { ...mainOpts, ...subOpts };

  return {
    subcommand,
    days: opts.days,
    since: opts.since,
    until: opts.until,
    mode: opts.mode,
    periodUnit: opts.periodUnit,
    authors: opts.authors,
    branch: opts.branch,
    minCommits: opts.minCommits,
    excludePatterns: opts.excludePatterns,
    respectGitignore: opts.respectGitignore,
    directory: opts.directory,
  };
}
