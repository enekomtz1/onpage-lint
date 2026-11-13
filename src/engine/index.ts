import type { Report, Rule, SiteContext } from '../types.js';

/** Finds and parses every HTML file under `rootDir`. */
export async function loadSite(rootDir: string): Promise<SiteContext> {
  void rootDir;
  throw new Error('loadSite is not implemented yet');
}

/** Runs the rules against every page of the site and builds the report. */
export function runRules(site: SiteContext, rules: readonly Rule[]): Report {
  void site;
  void rules;
  throw new Error('runRules is not implemented yet');
}

/** Loads the site at `rootDir` and runs the rules against it. */
export async function lint(rootDir: string, rules: readonly Rule[]): Promise<Report> {
  return runRules(await loadSite(rootDir), rules);
}
