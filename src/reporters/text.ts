import type { Finding, Report, Reporter } from '../types.js';

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function groupByPage(findings: readonly Finding[]): Map<string, Finding[]> {
  const groups = new Map<string, Finding[]>();
  for (const finding of findings) {
    const group = groups.get(finding.page);
    if (group) {
      group.push(finding);
    } else {
      groups.set(finding.page, [finding]);
    }
  }
  return groups;
}

/** Plain-text report for terminals: findings grouped by page, then a summary line. */
export const textReporter: Reporter = (report: Report): string => {
  const pages = plural(report.pagesScanned, 'page');
  if (report.findings.length === 0) {
    return `No problems found in ${pages}.`;
  }

  const lineLabel = (finding: Finding): string =>
    finding.line === undefined ? '-' : String(finding.line);
  const widthOf = (cell: (finding: Finding) => string): number =>
    Math.max(...report.findings.map((finding) => cell(finding).length));
  // Widths are shared across all pages so the columns line up in the whole report.
  const lineWidth = widthOf(lineLabel);
  const severityWidth = widthOf((finding) => finding.severity);
  const messageWidth = widthOf((finding) => finding.message);

  const formatRow = (finding: Finding): string =>
    [
      `  ${lineLabel(finding).padStart(lineWidth)}`,
      finding.severity.padEnd(severityWidth),
      finding.message.padEnd(messageWidth),
      finding.ruleId,
    ].join('  ');

  const blocks = [...groupByPage(report.findings)].map(([page, findings]) =>
    [page, ...findings.map(formatRow)].join('\n'),
  );
  const summary = `${plural(report.errorCount, 'error')}, ${plural(report.warningCount, 'warning')} in ${pages}`;

  return [...blocks, summary].join('\n\n');
};
