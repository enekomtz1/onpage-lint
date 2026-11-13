import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { isMainModule, run, type CliDeps } from '../../src/cli.js';
import type { Report, Rule } from '../../src/types.js';

let siteDir: string;
let tempRoot: string;

beforeAll(() => {
  tempRoot = mkdtempSync(path.join(tmpdir(), 'onpage-lint-cli-'));
  siteDir = path.join(tempRoot, 'site');
  mkdirSync(siteDir);
  writeFileSync(path.join(tempRoot, 'file.txt'), 'not a directory');
});

afterAll(() => {
  rmSync(tempRoot, { recursive: true, force: true });
});

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    rootDir: siteDir,
    pagesScanned: 3,
    findings: [],
    errorCount: 0,
    warningCount: 0,
    ...overrides,
  };
}

const twoWarnings = makeReport({
  findings: [
    { page: 'index.html', line: 2, ruleId: 'r1', severity: 'warning', message: 'First warning' },
    { page: 'index.html', line: 8, ruleId: 'r2', severity: 'warning', message: 'Second warning' },
  ],
  warningCount: 2,
});

const oneError = makeReport({
  findings: [{ page: 'index.html', ruleId: 'r3', severity: 'error', message: 'An error' }],
  errorCount: 1,
});

async function runCli(argv: string[], report: Report | Error = makeReport()) {
  let stdout = '';
  let stderr = '';
  const lint = vi.fn<CliDeps['lint']>(async () => {
    if (report instanceof Error) throw report;
    return report;
  });
  const rules: Rule[] = [
    { id: 'fake-rule', description: 'A fake rule.', severity: 'error', check: () => [] },
  ];
  const code = await run(argv, {
    lint,
    rules,
    stdout: (text) => {
      stdout += text;
    },
    stderr: (text) => {
      stderr += text;
    },
  });
  return { code, stdout, stderr, lint, rules };
}

const packageVersion = (
  JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
    version: string;
  }
).version;

describe('run', () => {
  describe('linting', () => {
    it('lints the resolved directory with the given rules and prints a text report', async () => {
      const { code, stdout, stderr, lint, rules } = await runCli([siteDir]);

      expect(code).toBe(0);
      expect(lint).toHaveBeenCalledWith(path.resolve(siteDir), rules);
      expect(stdout).toBe('No problems found in 3 pages.\n');
      expect(stderr).toBe('');
    });

    it('resolves a relative directory against the working directory', async () => {
      const relative = path.relative(process.cwd(), siteDir);
      const { code, lint } = await runCli([relative]);

      expect(code).toBe(0);
      expect(lint).toHaveBeenCalledWith(siteDir, expect.any(Array));
    });

    it('exits with 0 when there are only warnings', async () => {
      const { code, stdout } = await runCli([siteDir], twoWarnings);

      expect(code).toBe(0);
      expect(stdout).toContain('0 errors, 2 warnings in 3 pages\n');
    });

    it('exits with 1 when there is at least one error', async () => {
      const { code, stdout } = await runCli([siteDir], oneError);

      expect(code).toBe(1);
      expect(stdout).toContain('1 error, 0 warnings in 3 pages\n');
    });
  });

  describe('--format', () => {
    it('prints JSON with a trailing newline', async () => {
      const { code, stdout } = await runCli(['--format', 'json', siteDir], oneError);

      expect(code).toBe(1);
      expect(stdout.endsWith('}\n')).toBe(true);
      expect(JSON.parse(stdout)).toEqual(oneError);
    });

    it('accepts the -f short form and the --format=value form', async () => {
      const short = await runCli(['-f', 'json', siteDir]);
      const inline = await runCli([siteDir, '--format=text']);

      expect(JSON.parse(short.stdout)).toEqual(makeReport());
      expect(inline.stdout).toBe('No problems found in 3 pages.\n');
    });

    it('rejects an unknown format with exit code 2', async () => {
      const { code, stdout, stderr, lint } = await runCli(['--format', 'xml', siteDir]);

      expect(code).toBe(2);
      expect(stdout).toBe('');
      expect(stderr).toContain('unknown format "xml" (expected text or json)');
      expect(stderr).toContain('--help');
      expect(lint).not.toHaveBeenCalled();
    });
  });

  describe('--max-warnings', () => {
    it('passes when warnings do not exceed the limit', async () => {
      const { code, stderr } = await runCli(['--max-warnings', '2', siteDir], twoWarnings);

      expect(code).toBe(0);
      expect(stderr).toBe('');
    });

    it('fails with exit code 1 when warnings exceed the limit', async () => {
      const { code, stdout, stderr } = await runCli(['--max-warnings', '1', siteDir], twoWarnings);

      expect(code).toBe(1);
      expect(stdout).toContain('First warning');
      expect(stderr).toBe('onpage-lint: too many warnings (2, maximum allowed is 1)\n');
    });

    it('treats 0 as "no warnings allowed"', async () => {
      const { code } = await runCli(['--max-warnings=0', siteDir], twoWarnings);

      expect(code).toBe(1);
    });

    it('reports both errors and too many warnings', async () => {
      const both = makeReport({
        findings: [...oneError.findings, ...twoWarnings.findings],
        errorCount: 1,
        warningCount: 2,
      });
      const { code, stderr } = await runCli(['--max-warnings', '0', siteDir], both);

      expect(code).toBe(1);
      expect(stderr).toContain('too many warnings');
    });

    it.each(['-1', 'abc', '1.5', ''])('rejects %j with exit code 2', async (value) => {
      const { code, stderr, lint } = await runCli([`--max-warnings=${value}`, siteDir]);

      expect(code).toBe(2);
      expect(stderr).toContain('--max-warnings must be a non-negative integer');
      expect(lint).not.toHaveBeenCalled();
    });
  });

  describe('--help and --version', () => {
    it.each(['--help', '-h'])('%s prints usage and exits with 0', async (flag) => {
      const { code, stdout, stderr, lint } = await runCli([flag]);

      expect(code).toBe(0);
      expect(stdout).toMatch(/^Usage: onpage-lint <dir> \[options\]\n/);
      expect(stdout).toContain('--format');
      expect(stdout).toContain('--max-warnings');
      expect(stderr).toBe('');
      expect(lint).not.toHaveBeenCalled();
    });

    it('--help wins over a missing or extra directory', async () => {
      const { code } = await runCli(['a', 'b', '--help']);

      expect(code).toBe(0);
    });

    it.each(['--version', '-v'])('%s prints the package version', async (flag) => {
      const { code, stdout, lint } = await runCli([flag]);

      expect(code).toBe(0);
      expect(stdout).toBe(`${packageVersion}\n`);
      expect(lint).not.toHaveBeenCalled();
    });
  });

  describe('usage errors', () => {
    it.each([
      [[], 'missing the directory to lint'],
      [['a', 'b'], 'expected exactly one directory, got 2'],
      [['--verbose', 'site'], "Unknown option '--verbose'"],
      [['--format'], "Option '-f, --format <value>' argument missing"],
    ])('%j exits with 2 and explains why', async (argv, message) => {
      const { code, stdout, stderr, lint } = await runCli(argv);

      expect(code).toBe(2);
      expect(stdout).toBe('');
      expect(stderr).toContain(`onpage-lint: ${message}`);
      expect(stderr).toContain("Run 'onpage-lint --help' for usage.");
      expect(lint).not.toHaveBeenCalled();
    });
  });

  describe('run failures', () => {
    it('exits with 2 when the directory does not exist', async () => {
      const missing = path.join(tempRoot, 'missing');
      const { code, stderr, lint } = await runCli([missing]);

      expect(code).toBe(2);
      expect(stderr).toContain(`onpage-lint: directory not found: ${missing}`);
      expect(lint).not.toHaveBeenCalled();
    });

    it('exits with 2 when the path is a file', async () => {
      const file = path.join(tempRoot, 'file.txt');
      const { code, stderr, lint } = await runCli([file]);

      expect(code).toBe(2);
      expect(stderr).toContain(`onpage-lint: not a directory: ${file}`);
      expect(lint).not.toHaveBeenCalled();
    });

    it('exits with 2 when linting throws', async () => {
      const { code, stdout, stderr } = await runCli([siteDir], new Error('disk on fire'));

      expect(code).toBe(2);
      expect(stdout).toBe('');
      expect(stderr).toContain('onpage-lint: could not lint');
      expect(stderr).toContain('disk on fire');
    });
  });
});

describe('isMainModule', () => {
  beforeAll(() => {
    writeFileSync(path.join(tempRoot, 'cli.js'), '');
  });

  it('is true when argv[1] is the module file', () => {
    const file = path.join(tempRoot, 'cli.js');

    expect(isMainModule(pathToFileURL(file).href, file)).toBe(true);
  });

  it('is false for another script, a missing script or no script', () => {
    const file = path.join(tempRoot, 'cli.js');
    const other = path.join(tempRoot, 'file.txt');

    expect(isMainModule(pathToFileURL(file).href, other)).toBe(false);
    expect(isMainModule(pathToFileURL(file).href, path.join(tempRoot, 'nope.js'))).toBe(false);
    expect(isMainModule(pathToFileURL(file).href, undefined)).toBe(false);
  });

  it('follows symlinks such as the ones npm creates in node_modules/.bin', (context) => {
    const file = path.join(tempRoot, 'cli.js');
    const link = path.join(tempRoot, 'onpage-lint');
    try {
      symlinkSync(file, link, 'file');
    } catch {
      // Creating symlinks needs extra privileges on some Windows setups.
      context.skip();
    }

    expect(isMainModule(pathToFileURL(file).href, link)).toBe(true);
  });
});
