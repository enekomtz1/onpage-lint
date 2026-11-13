import type { CheerioAPI } from 'cheerio';
import type { Element } from 'domhandler';
import { lineOf } from '../../page.js';
import type { Rule, RuleResult } from '../../types.js';

function hasText($: CheerioAPI, heading: Element): boolean {
  if ($(heading).text().trim() !== '') return true;
  return $(heading)
    .find('img[alt]')
    .toArray()
    .some((img) => ($(img).attr('alt') ?? '').trim() !== '');
}

export const h1: Rule = {
  id: 'h1',
  description: 'Each page has exactly one <h1>, and it is not empty.',
  severity: 'error',
  check(page) {
    const { $ } = page;
    const headings = $('h1').toArray();
    const first = headings[0];
    if (!first) return [{ message: 'Page has no <h1>.' }];

    const results: RuleResult[] = [];
    const firstLine = lineOf(first);
    headings.forEach((heading, index) => {
      const line = lineOf(heading);
      if (!hasText($, heading)) {
        results.push({ message: '<h1> has no text.', line });
      }
      if (index > 0) {
        results.push({
          message: `Page has more than one <h1> (first on line ${firstLine ?? '?'}).`,
          line,
          severity: 'warning',
        });
      }
    });
    return results;
  },
};
