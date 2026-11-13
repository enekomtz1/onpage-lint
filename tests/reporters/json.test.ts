import { describe, expect, it } from 'vitest';
import { reporters } from '../../src/reporters/index.js';
import { jsonReporter } from '../../src/reporters/json.js';
import { textReporter } from '../../src/reporters/text.js';
import type { Report } from '../../src/types.js';

describe('jsonReporter', () => {
  it('prints the report as pretty JSON with a stable key order', () => {
    // Keys deliberately out of order to show the output does not depend on it.
    const report = {
      warningCount: 1,
      findings: [
        {
          message: 'Missing meta description',
          severity: 'warning',
          ruleId: 'meta-description',
          page: 'index.html',
        },
        {
          line: 4,
          message: 'Missing <title>',
          severity: 'error',
          ruleId: 'title',
          page: 'index.html',
        },
      ],
      errorCount: 1,
      pagesScanned: 2,
      rootDir: '/site',
    } as Report;

    expect(jsonReporter(report)).toBe(
      [
        '{',
        '  "rootDir": "/site",',
        '  "pagesScanned": 2,',
        '  "errorCount": 1,',
        '  "warningCount": 1,',
        '  "findings": [',
        '    {',
        '      "page": "index.html",',
        '      "ruleId": "meta-description",',
        '      "severity": "warning",',
        '      "message": "Missing meta description"',
        '    },',
        '    {',
        '      "page": "index.html",',
        '      "line": 4,',
        '      "ruleId": "title",',
        '      "severity": "error",',
        '      "message": "Missing <title>"',
        '    }',
        '  ]',
        '}',
      ].join('\n'),
    );
  });

  it('round-trips to an equal report', () => {
    const report: Report = {
      rootDir: '/site',
      pagesScanned: 0,
      findings: [],
      errorCount: 0,
      warningCount: 0,
    };

    expect(JSON.parse(jsonReporter(report))).toEqual(report);
  });
});

describe('reporters', () => {
  it('maps each format name to its reporter', () => {
    expect(reporters).toEqual({ text: textReporter, json: jsonReporter });
  });
});
