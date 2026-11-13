import { describe, expect, it } from 'vitest';
import { robotsNoindexRule } from '../../../src/rules/head/robots-noindex.js';
import { doc, page, run } from './fixtures.js';

const meta = (content: string, name = 'robots') => `    <meta name="${name}" content="${content}">`;

describe('robots-noindex', () => {
  it('has id robots-noindex and default severity warning', () => {
    expect(robotsNoindexRule.id).toBe('robots-noindex');
    expect(robotsNoindexRule.severity).toBe('warning');
  });

  it('passes when there is no robots meta tag', () => {
    expect(run(robotsNoindexRule, page(doc('    <title>Example page</title>')))).toEqual([]);
  });

  it('passes for robots directives that allow indexing', () => {
    expect(run(robotsNoindexRule, page(doc(meta('index, nofollow'))))).toEqual([]);
    expect(run(robotsNoindexRule, page(doc(meta('max-snippet:50'))))).toEqual([]);
  });

  it('warns about noindex in robots, with its line', () => {
    expect(run(robotsNoindexRule, page(doc(meta('noindex, follow'))))).toEqual([
      {
        message:
          '<meta name="robots" content="noindex, follow"> keeps this page out of search results.',
        line: 4,
      },
    ]);
  });

  it('matches name and content case-insensitively', () => {
    expect(run(robotsNoindexRule, page(doc(meta('NoIndex', 'ROBOTS'))))).toHaveLength(1);
  });

  it('warns about noindex in googlebot', () => {
    expect(run(robotsNoindexRule, page(doc(meta('nofollow,noindex', 'googlebot'))))).toEqual([
      {
        message:
          '<meta name="googlebot" content="nofollow,noindex"> keeps this page out of search results.',
        line: 4,
      },
    ]);
  });

  it('treats the "none" directive as noindex', () => {
    expect(run(robotsNoindexRule, page(doc(meta('none'))))).toHaveLength(1);
  });

  it('reports each matching tag', () => {
    const html = doc(`${meta('noindex')}\n${meta('noindex', 'googlebot')}`);
    expect(run(robotsNoindexRule, page(html)).map((result) => result.line)).toEqual([4, 5]);
  });

  it('ignores other meta names', () => {
    expect(run(robotsNoindexRule, page(doc(meta('noindex', 'bingbot-news'))))).toEqual([]);
  });
});
