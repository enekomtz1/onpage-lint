import type { CheerioAPI } from 'cheerio';
import type { Element } from 'domhandler';
import type { Page, SiteContext } from '../../types.js';

/** Lower-cased, whitespace-separated tokens of an attribute value such as `rel`. */
export function tokens(value: string | undefined): string[] {
  return (value ?? '').toLowerCase().split(/\s+/).filter(Boolean);
}

/** `<meta>` elements in `<head>` whose `name` matches one of `names`, case-insensitively. */
export function metasByName($: CheerioAPI, ...names: string[]): Element[] {
  const wanted = names.map((name) => name.toLowerCase());
  return $('head meta[name]')
    .toArray()
    .filter((el) => wanted.includes(($(el).attr('name') ?? '').trim().toLowerCase()));
}

/** `<link>` elements in `<head>` whose `rel` contains `rel` as one of its tokens. */
export function linksByRel($: CheerioAPI, rel: string): Element[] {
  const wanted = rel.toLowerCase();
  return $('head link[rel]')
    .toArray()
    .filter((el) => tokens($(el).attr('rel')).includes(wanted));
}

/** Length in Unicode code points, so an emoji counts as one character. */
export function charLength(value: string): number {
  return [...value].length;
}

/**
 * Relative paths of the other pages in the site for which `valueOf` returns
 * the same non-empty value as it does for `page`.
 */
export function pagesWithSameValue(
  page: Page,
  site: SiteContext,
  value: string,
  valueOf: (other: Page) => string | undefined,
): string[] {
  if (value === '') return [];
  return site.pages
    .filter((other) => other.relativePath !== page.relativePath && valueOf(other) === value)
    .map((other) => other.relativePath);
}
