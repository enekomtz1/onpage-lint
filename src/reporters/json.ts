import type { Report, Reporter } from '../types.js';

/** Machine-readable report. Keys are rebuilt in a fixed order so the output is stable. */
export const jsonReporter: Reporter = (report: Report): string => {
  const ordered = {
    rootDir: report.rootDir,
    pagesScanned: report.pagesScanned,
    errorCount: report.errorCount,
    warningCount: report.warningCount,
    findings: report.findings.map((finding) => ({
      page: finding.page,
      line: finding.line,
      ruleId: finding.ruleId,
      severity: finding.severity,
      message: finding.message,
    })),
  };
  return JSON.stringify(ordered, null, 2);
};
