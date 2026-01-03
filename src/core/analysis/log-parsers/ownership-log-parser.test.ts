import { describe, expect, test } from 'bun:test';
import { parseOwnershipStats } from './ownership-log-parser';

describe('parseOwnershipStats', () => {
  /**
   * Equivalence partitioning:
   * - Input log: empty string, single author/single file, single author/multiple files,
   *              multiple authors/same file, multiple authors/different files
   * - File changes: insertions only, deletions only, both, binary files (- notation)
   * - Author filter: none, single/multiple, case sensitivity
   * - Rename notation: {old => new}, { => new}, {old => }, { => }
   *
   * Boundary values:
   * - 0 line changes
   * - Equal line counts between authors (tie-breaking)
   * - Author name case sensitivity
   * - Empty author names
   */

  describe('empty and minimal input', () => {
    test('returns empty result for empty string', () => {
      // Arrange
      const log = '';

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files).toEqual({});
      expect(result.directories).toEqual({});
      expect(result.authors).toEqual({});
    });

    test('returns empty result for whitespace only', () => {
      // Arrange
      const log = '   \n   \n   ';

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files).toEqual({});
      expect(result.directories).toEqual({});
      expect(result.authors).toEqual({});
    });

    test('returns empty result for newlines only', () => {
      // Arrange
      const log = '\n\n\n';

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files).toEqual({});
      expect(result.directories).toEqual({});
      expect(result.authors).toEqual({});
    });

    test('returns empty result when AUTHOR: line has no author name', () => {
      // Arrange
      const log = `AUTHOR:
10\t5\tfile.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files).toEqual({});
      expect(result.directories).toEqual({});
      expect(result.authors).toEqual({});
    });
  });

  describe('single author, single file', () => {
    test('parses single author, single file correctly', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\tfile.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(Object.keys(result.files)).toHaveLength(1);
      expect(result.files['file.ts']).toEqual({
        file: 'file.ts',
        owner: 'John Doe',
        share: 100,
        ownerLines: 15,
        totalLines: 15,
        authors: { 'John Doe': 15 },
      });
      expect(result.authors['John Doe']).toBeDefined();
      expect(result.authors['John Doe'].totalFiles).toBe(1);
      expect(result.authors['John Doe'].totalLines).toBe(15);
    });

    test('calculates ownership percentage correctly for partial ownership', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\tfile.ts

AUTHOR: Jane Smith
20\t10\tfile.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files['file.ts'].owner).toBe('Jane Smith');
      expect(result.files['file.ts'].share).toBe(67); // 30/45 rounded
      expect(result.files['file.ts'].ownerLines).toBe(30);
      expect(result.files['file.ts'].totalLines).toBe(45);
    });

    test('handles insertions only (deletions = 0)', () => {
      // Arrange
      const log = `AUTHOR: John Doe
100\t0\tnew-file.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files['new-file.ts'].ownerLines).toBe(100);
      expect(result.files['new-file.ts'].totalLines).toBe(100);
    });

    test('handles deletions only (insertions = 0)', () => {
      // Arrange
      const log = `AUTHOR: John Doe
0\t50\tdeleted-content.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files['deleted-content.ts'].ownerLines).toBe(50);
      expect(result.files['deleted-content.ts'].totalLines).toBe(50);
    });

    test('handles no changes (0\t0) correctly', () => {
      // Arrange
      const log = `AUTHOR: John Doe
0\t0\tunchanged.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files['unchanged.ts'].ownerLines).toBe(0);
      expect(result.files['unchanged.ts'].totalLines).toBe(0);
    });
  });

  describe('single author, multiple files', () => {
    test('parses single author with multiple files correctly', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\tfile1.ts
20\t3\tfile2.ts
5\t0\tfile3.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(Object.keys(result.files)).toHaveLength(3);
      expect(result.files['file1.ts'].owner).toBe('John Doe');
      expect(result.files['file2.ts'].owner).toBe('John Doe');
      expect(result.files['file3.ts'].owner).toBe('John Doe');
      expect(result.authors['John Doe'].totalFiles).toBe(3);
      expect(result.authors['John Doe'].totalLines).toBe(43); // 15 + 23 + 5
    });

    test('aggregates multiple commits for same author and file', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\tfile.ts

AUTHOR: John Doe
20\t10\tfile.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files['file.ts'].ownerLines).toBe(45); // 15 + 30
      expect(result.files['file.ts'].totalLines).toBe(45);
      expect(result.files['file.ts'].share).toBe(100);
    });
  });

  describe('multiple authors', () => {
    test('determines primary owner as author with most lines', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\tfile.ts

AUTHOR: Jane Smith
50\t30\tfile.ts

AUTHOR: Bob Wilson
20\t10\tfile.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files['file.ts'].owner).toBe('Jane Smith');
      expect(result.files['file.ts'].ownerLines).toBe(80);
      expect(result.files['file.ts'].totalLines).toBe(125);
      expect(result.files['file.ts'].share).toBe(64); // 80/125 rounded
      expect(result.files['file.ts'].authors).toEqual({
        'John Doe': 15,
        'Jane Smith': 80,
        'Bob Wilson': 30,
      });
    });

    test('handles tie-breaking when authors have equal lines (first one wins)', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t10\tfile.ts

AUTHOR: Jane Smith
10\t10\tfile.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      // First author encountered with max lines becomes owner
      expect(result.files['file.ts'].owner).toBe('John Doe');
      expect(result.files['file.ts'].ownerLines).toBe(20);
      expect(result.files['file.ts'].totalLines).toBe(40);
      expect(result.files['file.ts'].share).toBe(50);
    });

    test('creates separate entries for different authors in different files', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\tfile1.ts

AUTHOR: Jane Smith
20\t10\tfile2.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(Object.keys(result.files)).toHaveLength(2);
      expect(result.files['file1.ts'].owner).toBe('John Doe');
      expect(result.files['file2.ts'].owner).toBe('Jane Smith');
      expect(result.authors['John Doe'].totalFiles).toBe(1);
      expect(result.authors['Jane Smith'].totalFiles).toBe(1);
    });
  });

  describe('directory ownership', () => {
    test('calculates directory ownership based on file count', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\tsrc/file1.ts
20\t10\tsrc/file2.ts

AUTHOR: Jane Smith
15\t8\tsrc/file3.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.directories['src/']).toBeDefined();
      expect(result.directories['src/'].owner).toBe('John Doe');
      expect(result.directories['src/'].ownerFiles).toBe(2);
      expect(result.directories['src/'].totalFiles).toBe(3);
      expect(result.directories['src/'].share).toBe(67); // 2/3 rounded
      expect(result.directories['src/'].totalLines).toBe(68); // 15 + 30 + 23
    });

    test('handles nested directories correctly', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\tsrc/utils/helper.ts
20\t10\tsrc/main.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.directories['src/']).toBeDefined();
      expect(result.directories['src/utils/']).toBeDefined();
      expect(result.directories['src/'].owner).toBe('John Doe');
      expect(result.directories['src/utils/'].owner).toBe('John Doe');
    });

    test('handles root directory (./) correctly', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\tfile.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.directories['./']).toBeDefined();
      expect(result.directories['./'].owner).toBe('John Doe');
    });

    test('determines directory owner when files are split between authors', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\tsrc/file1.ts
20\t10\tsrc/file2.ts

AUTHOR: Jane Smith
15\t8\tsrc/file3.ts
25\t12\tsrc/file4.ts
30\t15\tsrc/file5.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.directories['src/'].owner).toBe('Jane Smith');
      expect(result.directories['src/'].ownerFiles).toBe(3);
      expect(result.directories['src/'].totalFiles).toBe(5);
      expect(result.directories['src/'].share).toBe(60); // 3/5 rounded
    });
  });

  describe('rename notation normalization', () => {
    test('normalizes {old => new} notation to new path', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\t{old => new}/file.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files['new/file.ts']).toBeDefined();
      expect(result.files['new/file.ts'].owner).toBe('John Doe');
      expect(result.files['{old => new}/file.ts']).toBeUndefined();
    });

    test('normalizes { => new} notation to new path', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\t{ => new}/file.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files['new/file.ts']).toBeDefined();
    });

    test('normalizes {old => } notation (empty new path)', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\t{old => }/file.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      // File should be skipped if path becomes empty
      expect(Object.keys(result.files)).toHaveLength(0);
    });

    test('normalizes complex rename notation in nested paths', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\tdocs/{ => common}/file.md`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files['docs/common/file.md']).toBeDefined();
      expect(result.files['docs/common/file.md'].owner).toBe('John Doe');
    });

    test('handles multiple rename notations in same log', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\t{old1 => new1}/file1.ts
20\t10\t{old2 => new2}/file2.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files['new1/file1.ts']).toBeDefined();
      expect(result.files['new2/file2.ts']).toBeDefined();
    });
  });

  describe('author filter', () => {
    const multiAuthorLog = `AUTHOR: John Doe
10\t5\tfile1.ts

AUTHOR: Jane Smith
20\t10\tfile2.ts

AUTHOR: Bob Wilson
15\t8\tfile3.ts`;

    test('includes only specified author in filter', () => {
      // Arrange
      const authorFilter = ['John Doe'];

      // Act
      const result = parseOwnershipStats(multiAuthorLog, authorFilter);

      // Assert
      expect(Object.keys(result.files)).toHaveLength(1);
      expect(result.files['file1.ts']).toBeDefined();
      expect(result.files['file2.ts']).toBeUndefined();
      expect(result.files['file3.ts']).toBeUndefined();
      expect(result.authors['John Doe']).toBeDefined();
      expect(result.authors['Jane Smith']).toBeUndefined();
      expect(result.authors['Bob Wilson']).toBeUndefined();
    });

    test('allows multiple authors in filter', () => {
      // Arrange
      const authorFilter = ['John Doe', 'Jane Smith'];

      // Act
      const result = parseOwnershipStats(multiAuthorLog, authorFilter);

      // Assert
      expect(Object.keys(result.files)).toHaveLength(2);
      expect(result.files['file1.ts']).toBeDefined();
      expect(result.files['file2.ts']).toBeDefined();
      expect(result.files['file3.ts']).toBeUndefined();
      expect(result.authors['John Doe']).toBeDefined();
      expect(result.authors['Jane Smith']).toBeDefined();
      expect(result.authors['Bob Wilson']).toBeUndefined();
    });

    test('author filter is case-insensitive', () => {
      // Arrange
      const authorFilter = ['john doe'];

      // Act
      const result = parseOwnershipStats(multiAuthorLog, authorFilter);

      // Assert
      expect(Object.keys(result.files)).toHaveLength(1);
      expect(result.files['file1.ts']).toBeDefined();
      expect(result.authors['John Doe']).toBeDefined();
    });

    test('author filter matches with mixed case', () => {
      // Arrange
      const authorFilter = ['JOHN DOE', 'jane SMITH'];

      // Act
      const result = parseOwnershipStats(multiAuthorLog, authorFilter);

      // Assert
      expect(Object.keys(result.files)).toHaveLength(2);
      expect(result.authors['John Doe']).toBeDefined();
      expect(result.authors['Jane Smith']).toBeDefined();
    });

    test('returns empty result when no authors match filter', () => {
      // Arrange
      const authorFilter = ['Unknown Author'];

      // Act
      const result = parseOwnershipStats(multiAuthorLog, authorFilter);

      // Assert
      expect(result.files).toEqual({});
      expect(result.directories).toEqual({});
      expect(result.authors).toEqual({});
    });

    test('empty author filter array results in empty output', () => {
      // Arrange
      const authorFilter: string[] = [];

      // Act
      const result = parseOwnershipStats(multiAuthorLog, authorFilter);

      // Assert
      expect(result.files).toEqual({});
      expect(result.directories).toEqual({});
      expect(result.authors).toEqual({});
    });

    test('undefined author filter includes all authors', () => {
      // Arrange
      const authorFilter = undefined;

      // Act
      const result = parseOwnershipStats(multiAuthorLog, authorFilter);

      // Assert
      expect(Object.keys(result.files)).toHaveLength(3);
      expect(Object.keys(result.authors)).toHaveLength(3);
    });
  });

  describe('author ownership aggregation', () => {
    test('aggregates files owned by same author correctly', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\tfile1.ts
20\t10\tfile2.ts
15\t8\tfile3.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.authors['John Doe'].totalFiles).toBe(3);
      expect(result.authors['John Doe'].totalLines).toBe(68); // 15 + 30 + 23
      expect(result.authors['John Doe'].files).toHaveLength(3);
      // Files should be sorted by lines descending
      expect(result.authors['John Doe'].files[0].lines).toBe(30);
      expect(result.authors['John Doe'].files[1].lines).toBe(23);
      expect(result.authors['John Doe'].files[2].lines).toBe(15);
    });

    test('includes only files where author is primary owner', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\tfile1.ts

AUTHOR: Jane Smith
50\t30\tfile1.ts

AUTHOR: John Doe
20\t10\tfile2.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      // file1.ts is owned by Jane Smith (80 lines > 15 lines)
      // file2.ts is owned by John Doe
      expect(result.authors['John Doe'].totalFiles).toBe(1);
      expect(result.authors['John Doe'].files[0].file).toBe('file2.ts');
      expect(result.authors['Jane Smith'].totalFiles).toBe(1);
      expect(result.authors['Jane Smith'].files[0].file).toBe('file1.ts');
    });
  });

  describe('edge cases', () => {
    test('handles author name with special characters', () => {
      // Arrange
      const log = `AUTHOR: John O'Connor
10\t5\tfile.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files['file.ts'].owner).toBe("John O'Connor");
      expect(result.authors["John O'Connor"]).toBeDefined();
    });

    test('handles author name with Japanese characters', () => {
      // Arrange
      const log = `AUTHOR: 山田太郎
10\t5\tfile.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files['file.ts'].owner).toBe('山田太郎');
      expect(result.authors['山田太郎']).toBeDefined();
    });

    test('handles file path with spaces', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\tpath/to/my file.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files['path/to/my file.ts']).toBeDefined();
      expect(result.files['path/to/my file.ts'].owner).toBe('John Doe');
    });

    test('handles very large numbers correctly', () => {
      // Arrange
      const log = `AUTHOR: John Doe
999999\t888888\tlarge-file.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files['large-file.ts'].ownerLines).toBe(1888887);
      expect(result.files['large-file.ts'].totalLines).toBe(1888887);
    });

    test('handles consecutive empty lines correctly', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\tfile1.ts



AUTHOR: Jane Smith
20\t10\tfile2.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(Object.keys(result.files)).toHaveLength(2);
    });

    test('skips files with empty file path', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\t`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(Object.keys(result.files)).toHaveLength(0);
    });

    test('handles AUTHOR: prefix with whitespace', () => {
      // Arrange
      const log = `AUTHOR:  John Doe
10\t5\tfile.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(result.files['file.ts'].owner).toBe('John Doe');
    });

    test('handles numstat line without tab separator', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10 5 file.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      // Should be skipped as it doesn't contain tab
      expect(Object.keys(result.files)).toHaveLength(0);
    });

    test('handles numstat line with only two parts (missing file path)', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(Object.keys(result.files)).toHaveLength(0);
    });
  });

  describe('realistic git log output', () => {
    test('parses complex realistic log output correctly', () => {
      // Arrange
      const log = `AUTHOR: John Doe
15\t3\tsrc/index.ts
25\t10\tsrc/utils.ts
0\t50\tREADME.md

AUTHOR: Jane Smith
100\t0\tsrc/new-feature.ts
5\t2\tpackage.json

AUTHOR: John Doe
8\t8\tsrc/refactor.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      expect(Object.keys(result.files)).toHaveLength(6);

      // Check file ownership
      expect(result.files['src/index.ts'].owner).toBe('John Doe');
      expect(result.files['src/utils.ts'].owner).toBe('John Doe');
      expect(result.files['README.md'].owner).toBe('John Doe');
      expect(result.files['src/new-feature.ts'].owner).toBe('Jane Smith');
      expect(result.files['package.json'].owner).toBe('Jane Smith');
      expect(result.files['src/refactor.ts'].owner).toBe('John Doe');

      // Check directory ownership
      expect(result.directories['src/'].owner).toBe('John Doe');
      expect(result.directories['src/'].ownerFiles).toBe(3);
      expect(result.directories['src/'].totalFiles).toBe(4);

      // Check author ownership
      expect(result.authors['John Doe'].totalFiles).toBe(4);
      expect(result.authors['John Doe'].totalLines).toBe(119); // 18 + 35 + 50 + 16
      expect(result.authors['Jane Smith'].totalFiles).toBe(2);
      expect(result.authors['Jane Smith'].totalLines).toBe(107); // 100 + 7
    });

    test('handles rename operations in realistic scenario', () => {
      // Arrange
      const log = `AUTHOR: John Doe
10\t5\t{old => new}/file.ts
20\t10\tsrc/utils.ts

AUTHOR: Jane Smith
15\t8\tnew/file.ts`;

      // Act
      const result = parseOwnershipStats(log);

      // Assert
      // Both authors modified new/file.ts, Jane has more lines (23 > 15)
      expect(result.files['new/file.ts'].owner).toBe('Jane Smith');
      expect(result.files['new/file.ts'].ownerLines).toBe(23);
      expect(result.files['new/file.ts'].totalLines).toBe(38);
      expect(result.files['src/utils.ts'].owner).toBe('John Doe');
    });
  });
});
