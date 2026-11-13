import { lineOf } from '../../page.js';
import type { Rule, RuleResult } from '../../types.js';

/** `scheme:` (http, mailto, tel, javascript, data, …) or protocol-relative `//host`. */
const externalHref = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

type Resolution =
  | { kind: 'skip' }
  | { kind: 'invalid-encoding' }
  | { kind: 'above-root' }
  /** `candidates` are the site files that would satisfy the link, best match first. */
  | { kind: 'path'; candidates: string[] };

/** Resolves an `href` found on `fromPath` to the site files it may point to. */
function resolveHref(href: string, fromPath: string): Resolution {
  if (href === '' || href.startsWith('#') || externalHref.test(href)) return { kind: 'skip' };

  const rawPath = href.split(/[?#]/, 1)[0] ?? '';
  // Only a query or fragment: the link points at the current page.
  if (rawPath === '') return { kind: 'skip' };

  let decoded: string;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return { kind: 'invalid-encoding' };
  }

  const segments = decoded.startsWith('/') ? [] : fromPath.split('/').slice(0, -1);
  const parts = decoded.split('/');
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      if (segments.length === 0) return { kind: 'above-root' };
      segments.pop();
    } else {
      segments.push(part);
    }
  }

  const last = parts[parts.length - 1];
  const isDirectory = last === '' || last === '.' || last === '..';
  const target = segments.join('/');
  if (isDirectory) {
    return { kind: 'path', candidates: [target === '' ? 'index.html' : `${target}/index.html`] };
  }
  return { kind: 'path', candidates: [target, `${target}/index.html`, `${target}.html`] };
}

export const internalLinks: Rule = {
  id: 'internal-links',
  description: 'Every internal link points to a file that exists in the site.',
  severity: 'error',
  check(page, site) {
    const { $ } = page;
    const results: RuleResult[] = [];
    for (const anchor of $('a[href]').toArray()) {
      const href = ($(anchor).attr('href') ?? '').trim();
      const line = lineOf(anchor);
      const resolution = resolveHref(href, page.relativePath);
      switch (resolution.kind) {
        case 'skip':
          break;
        case 'invalid-encoding':
          results.push({ message: `Internal link "${href}" has invalid percent-encoding.`, line });
          break;
        case 'above-root':
          results.push({ message: `Internal link "${href}" points above the site root.`, line });
          break;
        case 'path': {
          const { candidates } = resolution;
          if (!candidates.some((candidate) => site.files.has(candidate))) {
            results.push({
              message: `Broken internal link "${href}": ${candidates[0] ?? ''} does not exist.`,
              line,
            });
          }
          break;
        }
      }
    }
    return results;
  },
};
