import { describe, expect, it } from 'vitest';
import { headRules } from '../../../src/rules/head/index.js';
import { doc, page, run } from './fixtures.js';

describe('headRules', () => {
  it('registers every head rule in documented order', () => {
    expect(headRules.map((rule) => rule.id)).toEqual([
      'title',
      'meta-description',
      'canonical',
      'html-lang',
      'viewport',
      'robots-noindex',
    ]);
  });

  it('finds nothing on a well-formed head', () => {
    const html = doc(`    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Handmade ceramic mugs and bowls</title>
    <meta name="description" content="Handmade ceramic mugs and bowls, glazed in small batches and shipped worldwide.">
    <link rel="canonical" href="https://example.com/">`);
    const target = page(html);

    expect(headRules.flatMap((rule) => run(rule, target))).toEqual([]);
  });
});
