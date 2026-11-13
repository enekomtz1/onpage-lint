import { describe, expect, it } from 'vitest';
import { contentRules } from '../../../src/rules/content/index.js';

describe('contentRules', () => {
  it('registers the content rules in documentation order', () => {
    expect(contentRules.map((rule) => rule.id)).toEqual([
      'h1',
      'img-alt',
      'internal-links',
      'json-ld',
    ]);
  });
});
