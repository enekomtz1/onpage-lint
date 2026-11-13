import type { Finding, Page, Report, Rule, RuleResult, SiteContext } from '../types.js';

function checkPage(rule: Rule, page: Page, site: SiteContext): Finding[] {
  let results: RuleResult[];
  try {
    results = rule.check(page, site);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return [
      {
        ruleId: rule.id,
        severity: 'error',
        message: `Rule crashed: ${reason}`,
        page: page.relativePath,
      },
    ];
  }

  return results.map((result) => {
    const finding: Finding = {
      ruleId: rule.id,
      severity: result.severity ?? rule.severity,
      message: result.message,
      page: page.relativePath,
    };
    if (result.line !== undefined) finding.line = result.line;
    return finding;
  });
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Page, then line (findings without a line first), then rule id. */
export function compareFindings(a: Finding, b: Finding): number {
  return (
    compareText(a.page, b.page) || (a.line ?? 0) - (b.line ?? 0) || compareText(a.ruleId, b.ruleId)
  );
}

/** Runs the rules against every page of the site and builds the report. */
export function runRules(site: SiteContext, rules: readonly Rule[]): Report {
  const findings: Finding[] = [];
  for (const page of site.pages) {
    for (const rule of rules) {
      findings.push(...checkPage(rule, page, site));
    }
  }
  // Array.prototype.sort is stable, so ties keep the order rules returned them in.
  findings.sort(compareFindings);

  const errorCount = findings.filter((finding) => finding.severity === 'error').length;
  return {
    rootDir: site.rootDir,
    pagesScanned: site.pages.length,
    findings,
    errorCount,
    warningCount: findings.length - errorCount,
  };
}
