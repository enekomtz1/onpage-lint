import path from 'node:path';
import { load } from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { Page, SiteContext } from './types.js';

export interface CreatePageInput {
  /** Absolute path of the site root. */
  rootDir: string;
  /** Path relative to the root, with forward slashes. */
  relativePath: string;
  html: string;
}

/** Parses an HTML string into a `Page`, keeping source locations for `lineOf`. */
export function createPage({ rootDir, relativePath, html }: CreatePageInput): Page {
  return {
    filePath: path.join(rootDir, ...relativePath.split('/')),
    relativePath,
    html,
    $: load(html, { sourceCodeLocationInfo: true }),
  };
}

/** Builds a `SiteContext` from pages. `files` defaults to the pages themselves. */
export function createSite(
  rootDir: string,
  pages: readonly Page[],
  files?: Iterable<string>,
): SiteContext {
  const sorted = [...pages].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return {
    rootDir,
    pages: sorted,
    files: new Set(files ?? sorted.map((page) => page.relativePath)),
  };
}

/** 1-based source line where a node starts, or `undefined` if it has no location. */
export function lineOf(node: AnyNode | undefined): number | undefined {
  return node?.sourceCodeLocation?.startLine;
}
