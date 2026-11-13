import type { Rule } from '../types.js';
import { contentRules } from './content/index.js';
import { headRules } from './head/index.js';

/** Every built-in rule, in the order they are documented. */
export const rules: Rule[] = [...headRules, ...contentRules];
