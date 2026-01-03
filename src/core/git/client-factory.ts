import type { SimpleGit } from 'simple-git';
import { GitClientImpl } from './client';
import type { GitClient } from './client.interface';

export function createGitClient(git?: SimpleGit): GitClient {
  return new GitClientImpl(git);
}
