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

  it('does not export React-facing service hooks from src/core', () => {
    const coreServicesPath = 'src/core/services.ts';
    const source = readFileSync(coreServicesPath, 'utf8');

    // Check for React-facing exports from @/services
    const exportsFromServices = /export\s+\{[^}]*\}\s+from\s+['"]@\/services['"]/g.test(source);

    // Check for specific React-facing identifiers
    const reactFacingIdentifiers = [
      'ServicesProvider',
      'ServicesContext',
      'useServices',
      'useEngine',
      'useTTS',
      'useASR',
      'useDialogue',
    ];

    const exportsReactIdentifiers = reactFacingIdentifiers.some((identifier) =>
      new RegExp(`export\\s+(?:type\\s+)?\\{[^}]*\\b${identifier}\\b[^}]*\\}`).test(source),
    );

    if (exportsFromServices || exportsReactIdentifiers) {
      throw new Error(
        `${coreServicesPath} must not export React-facing hooks or providers. ` +
          `Found exports from @/services or React-facing identifiers. ` +
          `Use @/services directly for React hooks.`,
      );
    }
  });
});
