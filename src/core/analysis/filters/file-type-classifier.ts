/**
 * File type classification for ownership analysis
 */

/**
 * File type categories
 */
export enum FileType {
  /** Source code files */
  SOURCE = 'source',
  /** Configuration and data files */
  CONFIG = 'config',
  /** Documentation files */
  DOCS = 'docs',
  /** Test files */
  TEST = 'test',
  /** Other/unknown files */
  OTHER = 'other',
}

/**
 * Source code file extensions
 */
const SOURCE_EXTENSIONS = [
  // Web
  'js',
  'jsx',
  'ts',
  'tsx',
  'vue',
  'svelte',
  'html',
  'css',
  'scss',
  'sass',
  'less',
  'styl',
  // Python
  'py',
  'pyx',
  'pyi',
  // Java/Kotlin
  'java',
  'kt',
  'kts',
  'scala',
  'groovy',
  // C/C++
  'c',
  'cpp',
  'cc',
  'cxx',
  'h',
  'hpp',
  'hxx',
  // Go
  'go',
  // Rust
  'rs',
  // Ruby
  'rb',
  'rake',
  // PHP
  'php',
  'phtml',
  // Swift
  'swift',
  // Objective-C
  'm',
  'mm',
  // C#
  'cs',
  // Dart
  'dart',
  // R
  'r',
  'R',
  // Shell scripts
  'sh',
  'bash',
  'zsh',
  'fish',
  // PowerShell
  'ps1',
  'psm1',
  // Lua
  'lua',
  // Perl
  'pl',
  'pm',
  // Elixir
  'ex',
  'exs',
  // Clojure
  'clj',
  'cljs',
  'cljc',
  // Erlang
  'erl',
  'hrl',
  // Haskell
  'hs',
  'lhs',
  // OCaml
  'ml',
  'mli',
  // F#
  'fs',
  'fsi',
  'fsx',
  // Scala
  'scala',
  'sc',
  // TypeScript/JavaScript (already included but being explicit)
  'mjs',
  'cjs',
  // WebAssembly
  'wasm',
  'wat',
];

/**
 * Configuration and data file extensions/patterns
 */
const CONFIG_PATTERNS = [
  // JSON/YAML/TOML config files
  'json',
  'yaml',
  'yml',
  'toml',
  'ini',
  'conf',
  'config',
  'properties',
  // Lock files
  'lock',
  // Package manager files
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'Cargo.toml',
  'Cargo.lock',
  'go.mod',
  'go.sum',
  'requirements.txt',
  'Pipfile',
  'Pipfile.lock',
  'poetry.lock',
  'setup.py',
  'setup.cfg',
  'pyproject.toml',
  'Gemfile',
  'Gemfile.lock',
  'composer.json',
  'composer.lock',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'Podfile',
  'Podfile.lock',
  'pubspec.yaml',
  // Config directories
  '.github',
  '.vscode',
  '.idea',
  // Docker
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  '.dockerignore',
  // CI/CD
  '.github/workflows',
  '.gitlab-ci.yml',
  'Jenkinsfile',
  '.travis.yml',
  '.circleci',
  // Environment
  '.env',
  '.env.local',
  '.env.*',
];

/**
 * Documentation file extensions
 */
const DOCS_EXTENSIONS = ['md', 'mdx', 'txt', 'rst', 'adoc', 'org', 'wiki'];

/**
 * Test file patterns
 */
const TEST_PATTERNS = [
  '.test.',
  '.spec.',
  '.test.',
  '__tests__',
  '__test__',
  'test_',
  'spec_',
  '.test.js',
  '.test.ts',
  '.spec.js',
  '.spec.ts',
];

/**
 * Classify a file path into a file type category
 */
export function classifyFileType(filePath: string): FileType {
  const lowerPath = filePath.toLowerCase();

  // Check for test files
  for (const pattern of TEST_PATTERNS) {
    if (lowerPath.includes(pattern)) {
      return FileType.TEST;
    }
  }

  // Check for config patterns
  for (const pattern of CONFIG_PATTERNS) {
    if (lowerPath.endsWith(pattern) || lowerPath.includes(`/${pattern}/`)) {
      return FileType.CONFIG;
    }
  }

  // Check file extension
  const lastDot = filePath.lastIndexOf('.');
  if (lastDot >= 0) {
    const extension = filePath.substring(lastDot + 1).toLowerCase();

    // Check docs
    if (DOCS_EXTENSIONS.includes(extension)) {
      return FileType.DOCS;
    }

    // Check source code
    if (SOURCE_EXTENSIONS.includes(extension)) {
      return FileType.SOURCE;
    }
  }

  // Check for common source code files without extension
  const fileName = filePath.split('/').pop()?.toLowerCase() || '';
  if (['makefile', 'rakefile', 'gemfile', 'rakefile.rb'].includes(fileName)) {
    return FileType.CONFIG;
  }

  // Default to other
  return FileType.OTHER;
}

/**
 * Group files by type
 */
export function groupFilesByType<T extends { file: string }>(files: T[]): Record<FileType, T[]> {
  const grouped: Record<FileType, T[]> = {
    [FileType.SOURCE]: [],
    [FileType.CONFIG]: [],
    [FileType.DOCS]: [],
    [FileType.TEST]: [],
    [FileType.OTHER]: [],
  };

  for (const file of files) {
    const fileType = classifyFileType(file.file);
    grouped[fileType].push(file);
  }

  return grouped;
}
