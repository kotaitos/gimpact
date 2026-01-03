/**
 * Contributor type classification
 */
export type ContributorType = 'Scout' | 'Generalist' | 'Refactorer' | 'Explorer' | 'Artisan';

/**
 * Contributor type with display information
 */
export interface ContributorTypeInfo {
  type: ContributorType;
  emoji: string;
  label: string;
}
