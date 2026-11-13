import type { Report, Rule, SiteContext } from '../types.js';
import { runRules } from './run.js';

export { runRules } from './run.js';

/** Finds and parses every HTML file under `rootDir`. */
export async function loadSite(rootDir: string): Promise<SiteContext> {
  void rootDir;
  throw new Error('loadSite is not implemented yet');
}

/** Loads the site at `rootDir` and runs the rules against it. */
export async function lint(rootDir: string, rules: readonly Rule[]): Promise<Report> {
  return runRules(await loadSite(rootDir), rules);
}
