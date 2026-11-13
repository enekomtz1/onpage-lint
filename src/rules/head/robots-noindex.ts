import type { Rule } from '../../types.js';
import { lineOf } from '../../page.js';
import { metasByName } from './helpers.js';

export const ROBOTS_META_NAMES = ['robots', 'googlebot'];

/** `none` is shorthand for `noindex, nofollow`, so it also blocks indexing. */
const NOINDEX_DIRECTIVES = ['noindex', 'none'];

export const robotsNoindexRule: Rule = {
  id: 'robots-noindex',
  description: 'Flags pages that a robots meta tag keeps out of search results with noindex.',
  severity: 'warning',
  check(page) {
    const { $ } = page;
    return metasByName($, ...ROBOTS_META_NAMES)
      .filter((meta) =>
        ($(meta).attr('content') ?? '')
          .toLowerCase()
          .split(/[\s,]+/)
          .some((directive) => NOINDEX_DIRECTIVES.includes(directive)),
      )
      .map((meta) => ({
        message: `<meta name="${($(meta).attr('name') ?? '').trim()}" content="${($(meta).attr('content') ?? '').trim()}"> keeps this page out of search results.`,
        line: lineOf(meta),
      }));
  },
};
