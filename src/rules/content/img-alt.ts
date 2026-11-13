import { lineOf } from '../../page.js';
import type { Rule, RuleResult } from '../../types.js';
import { normalizeAttr } from './attributes.js';

const hiddenRoles = new Set(['presentation', 'none']);

export const imgAlt: Rule = {
  id: 'img-alt',
  description: 'Every <img> has an alt attribute (empty for decorative images).',
  severity: 'error',
  check(page) {
    const { $ } = page;
    const results: RuleResult[] = [];
    for (const img of $('img').toArray()) {
      const $img = $(img);
      if ($img.attr('alt') !== undefined) continue;
      if (hiddenRoles.has(normalizeAttr($img.attr('role')))) continue;
      if (normalizeAttr($img.attr('aria-hidden')) === 'true') continue;

      const src = $img.attr('src');
      const message =
        src === undefined
          ? '<img> without src has no alt attribute.'
          : `<img src="${src}"> has no alt attribute.`;
      results.push({ message, line: lineOf(img) });
    }
    return results;
  },
};
