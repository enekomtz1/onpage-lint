import type { CheerioAPI } from 'cheerio';

/** How serious a finding is. Errors make the CLI exit with a non-zero code. */
export type Severity = 'error' | 'warning';

/** One parsed HTML file of the site being linted. */
export interface Page {
  /** Absolute path of the HTML file on disk. */
  filePath: string;
  /** Path relative to the site root, with forward slashes, e.g. `blog/index.html`. */
  relativePath: string;
  /** Raw HTML source. */
  html: string;
  /** Parsed document. Elements carry source locations; see `lineOf` in `page.ts`. */
  $: CheerioAPI;
}

/** Read-only view of the whole site, for rules that need to look across pages. */
export interface SiteContext {
  /** Absolute path of the site root directory. */
  rootDir: string;
  /** Every HTML page found under the root, sorted by `relativePath`. */
  pages: readonly Page[];
  /**
   * Every file found under the root (HTML and assets), as paths relative to
   * the root with forward slashes. Used to resolve internal links.
   */
  files: ReadonlySet<string>;
}

/** What a rule returns for each problem it finds on a page. */
export interface RuleResult {
  message: string;
  /** 1-based line in the HTML source, when known. */
  line?: number;
  /** Overrides the rule's default severity for this result. */
  severity?: Severity;
}

/** A single check. Rules are pure: they never read files or the network. */
export interface Rule {
  /** Stable kebab-case identifier, e.g. `meta-description`. */
  id: string;
  /** One-sentence explanation shown in documentation. */
  description: string;
  /** Default severity of the results this rule produces. */
  severity: Severity;
  check(page: Page, site: SiteContext): RuleResult[];
}

/** A rule result attached to the page and rule that produced it. */
export interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  /** `relativePath` of the page the finding belongs to. */
  page: string;
  line?: number;
}

/** The outcome of linting a site. */
export interface Report {
  rootDir: string;
  pagesScanned: number;
  /** Sorted by page, then line (findings without a line first), then rule id. */
  findings: Finding[];
  errorCount: number;
  warningCount: number;
}

/** Turns a report into the text printed by the CLI. */
export type Reporter = (report: Report) => string;
