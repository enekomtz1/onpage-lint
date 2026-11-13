import type { Rule } from '../../types.js';
import { canonicalRule } from './canonical.js';
import { htmlLangRule } from './html-lang.js';
import { metaDescriptionRule } from './meta-description.js';
import { titleRule } from './title.js';
import { viewportRule } from './viewport.js';

/** Rules about the document head: title, meta tags, canonical, lang. */
export const headRules: Rule[] = [
  titleRule,
  metaDescriptionRule,
  canonicalRule,
  htmlLangRule,
  viewportRule,
];
