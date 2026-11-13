import type { Rule } from '../../types.js';
import { h1 } from './h1.js';
import { imgAlt } from './img-alt.js';
import { internalLinks } from './internal-links.js';
import { jsonLd } from './json-ld.js';

/** Rules about the document body: headings, images, links, structured data. */
export const contentRules: Rule[] = [h1, imgAlt, internalLinks, jsonLd];
