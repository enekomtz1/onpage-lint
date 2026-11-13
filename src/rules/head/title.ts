import type { Page, Rule, RuleResult } from '../../types.js';
import { lineOf } from '../../page.js';
import { charLength, pagesWithSameValue } from './helpers.js';

export const TITLE_MIN_LENGTH = 10;
export const TITLE_MAX_LENGTH = 60;

function titleOf(page: Page): string | undefined {
  const first = page.$('head title').first();
  return first.length > 0 ? first.text().trim() : undefined;
}

export const titleRule: Rule = {
  id: 'title',
  description:
    'The page has exactly one non-empty <title> of a sensible length, unique in the site.',
  severity: 'error',
  check(page, site) {
    const { $ } = page;
    const titles = $('head title').toArray();
    const [first, second] = titles;
    if (!first) return [{ message: 'Missing <title> in <head>.' }];

    const results: RuleResult[] = [];
    if (second) {
      results.push({
        message: `Found ${titles.length} <title> elements in <head>; expected exactly one.`,
        line: lineOf(second),
      });
    }

    const line = lineOf(first);
    const title = $(first).text().trim();
    if (title === '') {
      results.push({ message: '<title> is empty.', line });
      return results;
    }

    const length = charLength(title);
    if (length < TITLE_MIN_LENGTH || length > TITLE_MAX_LENGTH) {
      results.push({
        message: `Title is ${length} characters long; aim for ${TITLE_MIN_LENGTH} to ${TITLE_MAX_LENGTH}.`,
        line,
        severity: 'warning',
      });
    }

    const twins = pagesWithSameValue(page, site, title, titleOf);
    if (twins.length > 0) {
      results.push({
        message: `Title "${title}" is also used by ${twins.join(', ')}.`,
        line,
        severity: 'warning',
      });
    }
    return results;
  },
};
