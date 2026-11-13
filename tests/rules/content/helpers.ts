import { createPage, createSite } from '../../../src/page.js';
import type { Rule, RuleResult } from '../../../src/types.js';

const rootDir = '/site';

interface RunOptions {
  /** Path of the page being checked, relative to the site root. */
  relativePath?: string;
  /** Files of the site; defaults to the page itself. */
  files?: Iterable<string>;
}

/** Runs one rule against an HTML string, as the engine would. */
export function run(rule: Rule, html: string, options: RunOptions = {}): RuleResult[] {
  const page = createPage({ rootDir, relativePath: options.relativePath ?? 'index.html', html });
  const site = createSite(rootDir, [page], options.files);
  return rule.check(page, site);
}

/** Wraps body markup in a minimal document. The body content starts on line 5. */
export function doc(body: string): string {
  return `<!doctype html>
<html lang="en">
<head><title>Example</title></head>
<body>
${body}
</body>
</html>
`;
}
