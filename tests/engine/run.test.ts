import { describe, expect, it } from 'vitest';
import { runRules } from '../../src/engine/index.js';
import { createPage, createSite } from '../../src/page.js';
import type { Page, Rule, RuleResult } from '../../src/types.js';

const html = '<!doctype html><html><head><title>Demo</title></head><body></body></html>';

function page(relativePath: string): Page {
  return createPage({ rootDir: '/site', relativePath, html });
}

function fakeRule(
  id: string,
  severity: Rule['severity'],
  results: (page: Page) => RuleResult[],
): Rule {
  return { id, description: `Fake rule ${id}.`, severity, check: results };
}

describe('runRules', () => {
  it('returns an empty report when there are no findings', () => {
    const site = createSite('/site', [page('a.html'), page('b.html')]);
    const rule = fakeRule('quiet', 'error', () => []);

    expect(runRules(site, [rule])).toEqual({
      rootDir: '/site',
      pagesScanned: 2,
      findings: [],
      errorCount: 0,
      warningCount: 0,
    });
  });

  it('turns results into findings with the rule default severity', () => {
    const site = createSite('/site', [page('index.html')]);
    const rule = fakeRule('needs-title', 'warning', () => [{ message: 'Too short', line: 3 }]);

    const report = runRules(site, [rule]);

    expect(report.findings).toEqual([
      {
        ruleId: 'needs-title',
        severity: 'warning',
        message: 'Too short',
        page: 'index.html',
        line: 3,
      },
    ]);
    expect(report.warningCount).toBe(1);
    expect(report.errorCount).toBe(0);
  });

  it('lets a result override the rule severity', () => {
    const site = createSite('/site', [page('index.html')]);
    const rule = fakeRule('mixed', 'warning', () => [
      { message: 'Bad', severity: 'error' },
      { message: 'Meh' },
    ]);

    const report = runRules(site, [rule]);

    expect(report.findings.map((f) => f.severity)).toEqual(['error', 'warning']);
    expect(report.errorCount).toBe(1);
    expect(report.warningCount).toBe(1);
  });

  it('does not add a line property when the result has none', () => {
    const site = createSite('/site', [page('index.html')]);
    const rule = fakeRule('no-line', 'error', () => [{ message: 'Missing' }]);

    const [finding] = runRules(site, [rule]).findings;

    expect(finding).not.toHaveProperty('line');
  });

  it('passes each page and the site to every rule', () => {
    const site = createSite('/site', [page('a.html'), page('b.html')]);
    const calls: string[] = [];
    const rule: Rule = {
      id: 'spy',
      description: 'Records calls.',
      severity: 'warning',
      check(p, s) {
        expect(s).toBe(site);
        calls.push(p.relativePath);
        return [];
      },
    };

    runRules(site, [rule, { ...rule, id: 'spy-2' }]);

    expect(calls.sort()).toEqual(['a.html', 'a.html', 'b.html', 'b.html']);
  });

  it('sorts by page, then line with line-less findings first, then rule id', () => {
    const site = createSite('/site', [page('b.html'), page('a.html')]);
    const zeta = fakeRule('zeta', 'warning', (p) =>
      p.relativePath === 'a.html'
        ? [{ message: 'z10', line: 10 }, { message: 'z-none' }, { message: 'z2', line: 2 }]
        : [{ message: 'zb', line: 1 }],
    );
    const alpha = fakeRule('alpha', 'error', (p) =>
      p.relativePath === 'a.html' ? [{ message: 'a2', line: 2 }, { message: 'a-none' }] : [],
    );

    const report = runRules(site, [zeta, alpha]);

    expect(report.findings.map((f) => `${f.page}:${f.message}`)).toEqual([
      'a.html:a-none',
      'a.html:z-none',
      'a.html:a2',
      'a.html:z2',
      'a.html:z10',
      'b.html:zb',
    ]);
  });

  it('records an error finding when a rule throws, and keeps running', () => {
    const site = createSite('/site', [page('a.html'), page('b.html')]);
    const broken = fakeRule('broken', 'warning', (p) => {
      if (p.relativePath === 'a.html') throw new Error('boom');
      return [{ message: 'fine' }];
    });
    const other = fakeRule('other', 'warning', () => [{ message: 'still ran' }]);

    const report = runRules(site, [broken, other]);

    expect(report.findings).toEqual([
      { ruleId: 'broken', severity: 'error', message: 'Rule crashed: boom', page: 'a.html' },
      { ruleId: 'other', severity: 'warning', message: 'still ran', page: 'a.html' },
      { ruleId: 'broken', severity: 'warning', message: 'fine', page: 'b.html' },
      { ruleId: 'other', severity: 'warning', message: 'still ran', page: 'b.html' },
    ]);
    expect(report.errorCount).toBe(1);
    expect(report.warningCount).toBe(3);
  });

  it('handles rules that throw values that are not errors', () => {
    const site = createSite('/site', [page('a.html')]);
    const rule = fakeRule('odd', 'warning', () => {
      throw 'plain string';
    });

    const [finding] = runRules(site, [rule]).findings;

    expect(finding?.message).toBe('Rule crashed: plain string');
  });
});
