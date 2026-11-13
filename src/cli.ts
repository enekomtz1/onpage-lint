#!/usr/bin/env node
import { readFileSync, realpathSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { lint as realLint } from './engine/index.js';
import { isFormatName, reporters } from './reporters/index.js';
import { rules as builtInRules } from './rules/index.js';
import type { Report, Rule } from './types.js';

const NAME = 'onpage-lint';

const HELP = `Usage: ${NAME} <dir> [options]

Lint the on-page SEO of the HTML files in a static site's build output.

Options:
  -f, --format <name>     Output format: text or json (default: text)
      --max-warnings <n>  Exit with code 1 when there are more than n warnings
  -h, --help              Show this help and exit
  -v, --version           Show the version number and exit

Exit codes:
  0  No errors found
  1  At least one error, or more warnings than --max-warnings allows
  2  Invalid usage, or the site could not be linted
`;

/** Everything `run` touches outside its arguments, so tests can replace it. */
export interface CliDeps {
  lint: (rootDir: string, rules: readonly Rule[]) => Promise<Report>;
  rules: readonly Rule[];
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

const defaultDeps: CliDeps = {
  lint: realLint,
  rules: builtInRules,
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

class UsageError extends Error {}

function readVersion(): string {
  // `../package.json` is the package root both from `src/` and from `dist/`.
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  ) as { version?: unknown };
  return String(packageJson.version);
}

function parseMaxWarnings(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!/^\d+$/.test(value)) {
    throw new UsageError(`--max-warnings must be a non-negative integer, got "${value}"`);
  }
  return Number(value);
}

async function assertDirectory(dir: string): Promise<void> {
  try {
    if (!(await stat(dir)).isDirectory()) {
      throw new UsageError(`not a directory: ${dir}`);
    }
  } catch (error) {
    if (error instanceof UsageError) throw error;
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new UsageError(`directory not found: ${dir}`);
    }
    throw new UsageError(`cannot read ${dir}: ${errorMessage(error)}`);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Runs the CLI with the given arguments (without `node` and the script) and returns the exit code. */
export async function run(argv: string[], deps: Partial<CliDeps> = {}): Promise<number> {
  const { lint, rules, stdout, stderr } = { ...defaultDeps, ...deps };

  const fail = (message: string): number => {
    stderr(`${NAME}: ${message}\nRun '${NAME} --help' for usage.\n`);
    return 2;
  };

  let rootDir: string;
  let format: keyof typeof reporters;
  let maxWarnings: number | undefined;
  try {
    const { values, positionals } = parseArgs({
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        format: { type: 'string', short: 'f', default: 'text' },
        'max-warnings': { type: 'string' },
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
      },
    });

    if (values.help) {
      stdout(HELP);
      return 0;
    }
    if (values.version) {
      stdout(`${readVersion()}\n`);
      return 0;
    }

    if (positionals.length === 0) throw new UsageError('missing the directory to lint');
    if (positionals.length > 1) {
      throw new UsageError(`expected exactly one directory, got ${positionals.length}`);
    }
    if (!isFormatName(values.format)) {
      throw new UsageError(`unknown format "${values.format}" (expected text or json)`);
    }
    format = values.format;
    maxWarnings = parseMaxWarnings(values['max-warnings']);
    rootDir = path.resolve(positionals[0] as string);
    await assertDirectory(rootDir);
  } catch (error) {
    return fail(errorMessage(error));
  }

  let report: Report;
  try {
    report = await lint(rootDir, rules);
  } catch (error) {
    return fail(`could not lint ${rootDir}: ${errorMessage(error)}`);
  }

  stdout(`${reporters[format](report)}\n`);

  const tooManyWarnings = maxWarnings !== undefined && report.warningCount > maxWarnings;
  if (tooManyWarnings) {
    stderr(
      `${NAME}: too many warnings (${report.warningCount}, maximum allowed is ${maxWarnings})\n`,
    );
  }
  return report.errorCount > 0 || tooManyWarnings ? 1 : 0;
}

/**
 * Whether the module at `moduleUrl` is the script Node was started with. Both
 * sides go through `realpathSync` so npm's `.bin` symlinks and Windows path
 * spelling differences do not matter.
 */
export function isMainModule(moduleUrl: string, scriptPath: string | undefined): boolean {
  if (!scriptPath) return false;
  try {
    const modulePath = realpathSync.native(fileURLToPath(moduleUrl));
    const entryPath = realpathSync.native(path.resolve(scriptPath));
    return process.platform === 'win32'
      ? modulePath.toLowerCase() === entryPath.toLowerCase()
      : modulePath === entryPath;
  } catch {
    return false;
  }
}

if (isMainModule(import.meta.url, process.argv[1])) {
  process.exitCode = await run(process.argv.slice(2));
}
