import type { Rule } from '../../types.js';
import { lineOf } from '../../page.js';

/** A plausibility check, not a full BCP 47 validator: language plus optional subtags. */
export const BCP47_PATTERN = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/;

export const htmlLangRule: Rule = {
  id: 'html-lang',
  description: 'The <html> element declares the page language with a valid lang attribute.',
  severity: 'error',
  check(page) {
    const html = page.$('html').first();
    const line = lineOf(html.get(0));
    const lang = html.attr('lang');

    if (lang === undefined) return [{ message: '<html> has no lang attribute.', line }];
    const value = lang.trim();
    if (value === '') return [{ message: '<html> has an empty lang attribute.', line }];
    if (!BCP47_PATTERN.test(value)) {
      return [
        {
          message: `lang="${value}" does not look like a valid BCP 47 language tag.`,
          line,
          severity: 'warning',
        },
      ];
    }
    return [];
  },
};
