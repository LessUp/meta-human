/**
 * Architecture guard tests for src/core/ layer.
 *
 * Ensures core/ remains runtime-only with no React dependencies.
 */

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const collectSourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return collectSourceFiles(path);
    return /\.(ts|tsx)$/.test(path) ? [path] : [];
  });

describe('core architecture', () => {
  it('keeps React imports out of src/core', () => {
    const offenders = collectSourceFiles('src/core').filter((file) => {
      const source = readFileSync(file, 'utf8');
      return /from ['"]react['"]|import React/.test(source);
    });

    expect(offenders).toEqual([]);
  });
});
