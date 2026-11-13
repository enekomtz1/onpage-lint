import { describe, expect, it } from 'vitest';
import { htmlLangRule } from '../../../src/rules/head/html-lang.js';
import { doc, page, run } from './fixtures.js';

const HEAD = '    <title>Example page</title>';
const withHtml = (htmlOpen: string) => page(doc(HEAD, htmlOpen));

describe('html-lang', () => {
  it('has id html-lang and default severity error', () => {
    expect(htmlLangRule.id).toBe('html-lang');
    expect(htmlLangRule.severity).toBe('error');
  });

  it.each(['en', 'en-US', 'es-419', 'zh-Hant-TW', 'gsw'])('accepts lang="%s"', (lang) => {
    expect(run(htmlLangRule, withHtml(`<html lang="${lang}">`))).toEqual([]);
  });

  it('matches the attribute name case-insensitively', () => {
    expect(run(htmlLangRule, withHtml('<HTML LANG="en">'))).toEqual([]);
  });

  it('reports a missing lang attribute with the line of <html>', () => {
    expect(run(htmlLangRule, withHtml('<html>'))).toEqual([
      { message: '<html> has no lang attribute.', line: 2 },
    ]);
  });

  it('reports an empty lang attribute', () => {
    expect(run(htmlLangRule, withHtml('<html lang=" ">'))).toEqual([
      { message: '<html> has an empty lang attribute.', line: 2 },
    ]);
  });

  it('reports a missing lang without a line when <html> is implied', () => {
    expect(run(htmlLangRule, page('<title>Example page</title><p>Hi</p>'))).toEqual([
      { message: '<html> has no lang attribute.' },
    ]);
  });

  it.each(['english', 'en_US', 'e', 'en-', '12'])('warns about lang="%s"', (lang) => {
    expect(run(htmlLangRule, withHtml(`<html lang="${lang}">`))).toEqual([
      {
        message: `lang="${lang}" does not look like a valid BCP 47 language tag.`,
        line: 2,
        severity: 'warning',
      },
    ]);
  });
});
