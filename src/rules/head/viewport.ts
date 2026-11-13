import type { Rule } from '../../types.js';
import { lineOf } from '../../page.js';
import { metasByName } from './helpers.js';

/** True if a viewport `content` value sets `width=device-width`, ignoring case and spaces. */
function hasDeviceWidth(content: string): boolean {
  return content.split(/[,;]/).some((pair) => {
    const [key, value] = pair.split('=').map((part) => part.trim().toLowerCase());
    return key === 'width' && value === 'device-width';
  });
}

export const viewportRule: Rule = {
  id: 'viewport',
  description: 'The page has a viewport meta tag with width=device-width for mobile rendering.',
  severity: 'error',
  check(page) {
    const { $ } = page;
    const [meta] = metasByName($, 'viewport');
    if (!meta) return [{ message: 'Missing <meta name="viewport"> in <head>.' }];

    const content = ($(meta).attr('content') ?? '').trim();
    if (!hasDeviceWidth(content)) {
      return [
        {
          message: `Viewport content "${content}" does not include width=device-width.`,
          line: lineOf(meta),
          severity: 'warning',
        },
      ];
    }
    return [];
  },
};
