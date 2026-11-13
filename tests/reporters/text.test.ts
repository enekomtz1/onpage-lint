import { describe, expect, it } from 'vitest';
import { textReporter } from '../../src/reporters/text.js';
import type { Report } from '../../src/types.js';

const report: Report = {
  rootDir: '/site',
  pagesScanned: 12,
  findings: [
    {
      page: 'about/index.html',
      ruleId: 'meta-description',
      severity: 'warning',
      message: 'Missing meta description',
    },
    {
      page: 'about/index.html',
      line: 4,
      ruleId: 'title-length',
      severity: 'error',
      message: 'Title is too long (82 characters)',
    },
    {
      page: 'index.html',
      line: 12,
      ruleId: 'img-alt',
      severity: 'error',
      message: 'Image is missing alt text',
    },
    {
      page: 'index.html',
      line: 120,
      ruleId: 'img-alt',
      severity: 'error',
      message: 'Image is missing alt text',
    },
    {
      page: 'index.html',
      line: 130,
      ruleId: 'heading-order',
      severity: 'warning',
      message: 'Heading level skips from h2 to h4',
    },
  ],
  errorCount: 3,
  warningCount: 2,
};

describe('textReporter', () => {
  it('groups findings by page in aligned columns and ends with a summary', () => {
    expect(textReporter(report)).toBe(
      [
        'about/index.html',
        '    -  warning  Missing meta description           meta-description',
        '    4  error    Title is too long (82 characters)  title-length',
        '',
        'index.html',
        '   12  error    Image is missing alt text          img-alt',
        '  120  error    Image is missing alt text          img-alt',
        '  130  warning  Heading level skips from h2 to h4  heading-order',
        '',
        '3 errors, 2 warnings in 12 pages',
      ].join('\n'),
    );
  });

  it('uses singular nouns for counts of one', () => {
    const output = textReporter({
      rootDir: '/site',
      pagesScanned: 1,
      findings: [
        { page: 'index.html', line: 3, ruleId: 'a', severity: 'error', message: 'A' },
        { page: 'index.html', line: 5, ruleId: 'b', severity: 'warning', message: 'B' },
      ],
      errorCount: 1,
      warningCount: 1,
    });

    expect(output.split('\n').at(-1)).toBe('1 error, 1 warning in 1 page');
  });

  it('prints a friendly line when there are no findings', () => {
    const output = textReporter({
      rootDir: '/site',
      pagesScanned: 7,
      findings: [],
      errorCount: 0,
      warningCount: 0,
    });

    expect(output).toBe('No problems found in 7 pages.');
  });

  it('never emits ANSI escape codes or trailing whitespace', () => {
    const output = textReporter(report);

    expect(output).not.toMatch(/\u001b\[/);
    for (const line of output.split('\n')) {
      expect(line).toBe(line.trimEnd());
    }
  });
});
