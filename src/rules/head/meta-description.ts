import type { Page, Rule, RuleResult } from '../../types.js';
import { lineOf } from '../../page.js';
import { charLength, metasByName, pagesWithSameValue } from './helpers.js';

export const DESCRIPTION_MIN_LENGTH = 50;
export const DESCRIPTION_MAX_LENGTH = 160;

function descriptionOf(page: Page): string | undefined {
  const [first] = metasByName(page.$, 'description');
  return first ? (page.$(first).attr('content') ?? '').trim() : undefined;
}

export const metaDescriptionRule: Rule = {
  id: 'meta-description',
  description:
    'The page has exactly one non-empty meta description of a sensible length, unique in the site.',
  severity: 'error',
  check(page, site) {
    const { $ } = page;
    const metas = metasByName($, 'description');
    const [first, second] = metas;
    if (!first) return [{ message: 'Missing <meta name="description"> in <head>.' }];

    const results: RuleResult[] = [];
    if (second) {
      results.push({
        message: `Found ${metas.length} <meta name="description"> elements; expected exactly one.`,
        line: lineOf(second),
      });
    }

    const line = lineOf(first);
    const description = ($(first).attr('content') ?? '').trim();
    if (description === '') {
      results.push({ message: 'Meta description is empty.', line });
      return results;
    }

    const length = charLength(description);
    if (length < DESCRIPTION_MIN_LENGTH || length > DESCRIPTION_MAX_LENGTH) {
      results.push({
        message: `Meta description is ${length} characters long; aim for ${DESCRIPTION_MIN_LENGTH} to ${DESCRIPTION_MAX_LENGTH}.`,
        line,
        severity: 'warning',
      });
    }

    const twins = pagesWithSameValue(page, site, description, descriptionOf);
    if (twins.length > 0) {
      results.push({
        message: `Meta description is also used by ${twins.join(', ')}.`,
        line,
        severity: 'warning',
      });
    }
    return results;
  },
};
