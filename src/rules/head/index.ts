import type { Rule } from '../../types.js';
import { canonicalRule } from './canonical.js';
import { metaDescriptionRule } from './meta-description.js';
import { titleRule } from './title.js';

/** Rules about the document head: title, meta tags, canonical, lang. */
export const headRules: Rule[] = [titleRule, metaDescriptionRule, canonicalRule];
