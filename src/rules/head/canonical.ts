import type { Rule, RuleResult } from '../../types.js';
import { lineOf } from '../../page.js';
import { linksByRel } from './helpers.js';

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

export const canonicalRule: Rule = {
  id: 'canonical',
  description: 'The page declares one canonical URL, and it is an absolute http(s) URL.',
  severity: 'error',
  check(page) {
    const { $ } = page;
    const links = linksByRel($, 'canonical');
    const [first, second] = links;
    if (!first) {
      return [{ message: 'Missing <link rel="canonical"> in <head>.', severity: 'warning' }];
    }

    const results: RuleResult[] = [];
    if (second) {
      results.push({
        message: `Found ${links.length} <link rel="canonical"> elements; expected exactly one.`,
        line: lineOf(second),
      });
    }

    const line = lineOf(first);
    const href = ($(first).attr('href') ?? '').trim();
    if (href === '') {
      results.push({ message: 'Canonical link has an empty href.', line });
    } else if (!isAbsoluteHttpUrl(href)) {
      results.push({ message: `Canonical href "${href}" is not an absolute http(s) URL.`, line });
    }
    return results;
  },
};
