import chalk from 'chalk';
import type { OwnershipAnalysisResult } from '@/core';
import { printOwnershipTree } from '../utils/ownership-formatter';
import type { Printer } from './printer.interface';

export class OwnershipPrinter implements Printer {
  private directory?: string;

  constructor(directory?: string) {
    this.directory = directory;
  }

  print(result: OwnershipAnalysisResult, _timeRangeDescription: string): void {
    this.printFileOwnershipTree(result.files);
  }

  private printFileOwnershipTree(files: OwnershipAnalysisResult['files']): void {
    const fileEntries = Object.values(files) as OwnershipAnalysisResult['files'][string][];

    if (fileEntries.length === 0) {
      console.log(chalk.yellow(`\n⚠ No files found in the specified time range.\n`));
      return;
    }

    // Convert to record format for tree formatter
    const filesRecord: Record<string, (typeof fileEntries)[0]> = {};
    for (const file of fileEntries) {
      filesRecord[file.file] = file;
    }

    printOwnershipTree(filesRecord, {
      maxDepth: 10,
      directory: this.directory,
    });
  }
}
