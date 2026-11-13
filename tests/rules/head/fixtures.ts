import { createPage, createSite } from '../../../src/page.js';
import type { Page, Rule, RuleResult, SiteContext } from '../../../src/types.js';

export const ROOT = '/site';

/**
 * Wraps head markup in a minimal document. The first line of `head` lands on
 * line 4 of the source, which keeps expected line numbers easy to compute.
 */
export function doc(head: string, htmlOpen = '<html lang="en">'): string {
  return `<!doctype html>
${htmlOpen}
  <head>
${head}
  </head>
  <body>
    <h1>Example</h1>
  </body>
</html>
`;
}

export function page(html: string, relativePath = 'index.html'): Page {
  return createPage({ rootDir: ROOT, relativePath, html });
}

/** Runs `rule` on the first page, with all the given pages forming the site. */
export function run(rule: Rule, target: Page, ...others: Page[]): RuleResult[] {
  const site: SiteContext = createSite(ROOT, [target, ...others]);
  return rule.check(target, site);
}
