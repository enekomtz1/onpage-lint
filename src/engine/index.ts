import type { Report, Rule } from '../types.js';
import { loadSite } from './load.js';
import { runRules } from './run.js';

export { loadSite } from './load.js';
export { runRules } from './run.js';

/** Loads the site at `rootDir` and runs the rules against it. */
export async function lint(rootDir: string, rules: readonly Rule[]): Promise<Report> {
  return runRules(await loadSite(rootDir), rules);
}
