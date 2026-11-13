import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { run } from '../../src/cli.js';
import { rules } from '../../src/rules/index.js';

const examplesDir = fileURLToPath(new URL('../../examples/', import.meta.url));
const goodSite = path.join(examplesDir, 'good-site');
const badSite = path.join(examplesDir, 'bad-site');

const allRuleIds = rules.map((rule) => rule.id);

interface JsonReport {
  rootDir: string;
  pagesScanned: number;
  errorCount: number;
  warningCount: number;
  findings: {
    page: string;
    line?: number;
    ruleId: string;
    severity: 'error' | 'warning';
    message: string;
  }[];
}

/** Runs the real CLI pipeline (real engine and rules) with captured output. */
async function runCli(argv: string[]) {
  let stdout = '';
  let stderr = '';
  const code = await run(argv, {
    stdout: (text) => {
      stdout += text;
    },
    stderr: (text) => {
      stderr += text;
    },
  });
  return { code, stdout, stderr };
}

async function lintJson(dir: string): Promise<JsonReport> {
  const { stdout } = await runCli([dir, '--format', 'json']);
  return JSON.parse(stdout) as JsonReport;
}

describe('examples/good-site', () => {
  it('exits 0 and reports no problems', async () => {
    const { code, stdout, stderr } = await runCli([goodSite]);
    expect(code).toBe(0);
    expect(stdout).toBe('No problems found in 4 pages.\n');
    expect(stderr).toBe('');
  });

  it('produces an empty JSON report', async () => {
    const report = await lintJson(goodSite);
    expect(report).toMatchObject({
      rootDir: goodSite,
      pagesScanned: 4,
      errorCount: 0,
      warningCount: 0,
      findings: [],
    });
  });

  it('passes with --max-warnings 0', async () => {
    const { code, stderr } = await runCli([goodSite, '--max-warnings', '0']);
    expect(code).toBe(0);
    expect(stderr).toBe('');
  });
});

describe('examples/bad-site', () => {
  it('exits 1 and reports every rule in the text output', async () => {
    const { code, stdout, stderr } = await runCli([badSite]);
    expect(code).toBe(1);
    expect(stderr).toBe('');
    for (const page of ['index.html', 'about/index.html', 'blog/opening-week.html']) {
      expect(stdout.split('\n')).toContain(page);
    }
    for (const id of allRuleIds) {
      expect(stdout).toMatch(new RegExp(`  ${id}$`, 'm'));
    }
    expect(stdout).toMatch(/^\d+ errors, \d+ warnings in 3 pages\n$/m);
  });

  it('reports at least one finding for each of the 10 rules in JSON', async () => {
    const report = await lintJson(badSite);
    expect(allRuleIds).toHaveLength(10);
    const reported = new Set(report.findings.map((finding) => finding.ruleId));
    expect([...reported].sort()).toEqual([...allRuleIds].sort());
  });

  it('JSON counts match the findings and the text summary', async () => {
    const report = await lintJson(badSite);
    const errors = report.findings.filter((finding) => finding.severity === 'error').length;
    const warnings = report.findings.filter((finding) => finding.severity === 'warning').length;

    expect(report.rootDir).toBe(badSite);
    expect(report.pagesScanned).toBe(3);
    expect(report.errorCount).toBe(errors);
    expect(report.warningCount).toBe(warnings);
    expect(errors).toBeGreaterThan(0);
    expect(warnings).toBeGreaterThan(0);

    const { stdout } = await runCli([badSite]);
    expect(stdout).toContain(`${errors} errors, ${warnings} warnings in 3 pages`);
  });

  it('finds the specific problems planted in each page', async () => {
    const report = await lintJson(badSite);
    const has = (page: string, ruleId: string, severity: 'error' | 'warning') =>
      report.findings.some(
        (finding) =>
          finding.page === page && finding.ruleId === ruleId && finding.severity === severity,
      );

    expect(has('index.html', 'html-lang', 'error')).toBe(true);
    expect(has('index.html', 'viewport', 'error')).toBe(true);
    expect(has('index.html', 'meta-description', 'error')).toBe(true);
    expect(has('index.html', 'canonical', 'error')).toBe(true);
    expect(has('index.html', 'img-alt', 'error')).toBe(true);
    expect(has('index.html', 'json-ld', 'error')).toBe(true);
    expect(has('index.html', 'internal-links', 'error')).toBe(true);
    expect(has('about/index.html', 'robots-noindex', 'warning')).toBe(true);
    expect(has('about/index.html', 'h1', 'warning')).toBe(true);
    expect(has('about/index.html', 'json-ld', 'warning')).toBe(true);
    expect(has('blog/opening-week.html', 'h1', 'error')).toBe(true);
    expect(has('blog/opening-week.html', 'title', 'warning')).toBe(true);
  });

  it('does not report the linked CSS and image files as broken', async () => {
    const report = await lintJson(badSite);
    const messages = report.findings.map((finding) => finding.message).join('\n');
    expect(messages).not.toContain('style.css');
    expect(messages).not.toMatch(/Broken internal link "[^"]*logo\.svg"/);
  });

  it('with --max-warnings 0 still exits 1 and explains the warning limit', async () => {
    const report = await lintJson(badSite);
    const { code, stderr } = await runCli([badSite, '--max-warnings', '0']);
    expect(code).toBe(1);
    expect(stderr).toBe(
      `onpage-lint: too many warnings (${report.warningCount}, maximum allowed is 0)\n`,
    );
  });

  it('with a --max-warnings above the warning count exits 1 only because of errors', async () => {
    const report = await lintJson(badSite);
    const { code, stderr } = await runCli([badSite, '--max-warnings', String(report.warningCount)]);
    expect(code).toBe(1);
    expect(stderr).toBe('');
  });
});
