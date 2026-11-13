import { describe, expect, it } from 'vitest';
import { canonicalRule } from '../../../src/rules/head/canonical.js';
import { doc, page, run } from './fixtures.js';

const link = (href: string, rel = 'canonical') => `    <link rel="${rel}" href="${href}">`;

describe('canonical', () => {
  it('has id canonical and default severity error', () => {
    expect(canonicalRule.id).toBe('canonical');
    expect(canonicalRule.severity).toBe('error');
  });

  it('passes for one absolute http or https canonical URL', () => {
    expect(run(canonicalRule, page(doc(link('https://example.com/shop/'))))).toEqual([]);
    expect(run(canonicalRule, page(doc(link('http://example.com/'))))).toEqual([]);
  });

  it('matches rel case-insensitively and among several tokens', () => {
    expect(run(canonicalRule, page(doc(link('https://example.com/', 'CANONICAL'))))).toEqual([]);
    expect(
      run(canonicalRule, page(doc(link('https://example.com/', 'alternate  canonical')))),
    ).toEqual([]);
  });

  it('does not mistake a link whose rel only contains the word for a canonical', () => {
    expect(run(canonicalRule, page(doc(link('https://example.com/', 'noncanonical'))))).toEqual([
      { message: 'Missing <link rel="canonical"> in <head>.', severity: 'warning' },
    ]);
  });

  it('warns when there is no canonical link', () => {
    expect(run(canonicalRule, page(doc('    <title>Example page</title>')))).toEqual([
      { message: 'Missing <link rel="canonical"> in <head>.', severity: 'warning' },
    ]);
  });

  it('reports more than one canonical link, pointing at the second', () => {
    const html = doc(`${link('https://example.com/a')}\n${link('https://example.com/b')}`);
    expect(run(canonicalRule, page(html))).toEqual([
      { message: 'Found 2 <link rel="canonical"> elements; expected exactly one.', line: 5 },
    ]);
  });

  it('reports an empty or missing href', () => {
    expect(run(canonicalRule, page(doc(link(' '))))).toEqual([
      { message: 'Canonical link has an empty href.', line: 4 },
    ]);
    expect(run(canonicalRule, page(doc('    <link rel="canonical">')))).toEqual([
      { message: 'Canonical link has an empty href.', line: 4 },
    ]);
  });

  it('reports a relative href', () => {
    expect(run(canonicalRule, page(doc(link('/shop/'))))).toEqual([
      {
        message: 'Canonical href "/shop/" is not an absolute http(s) URL.',
        line: 4,
      },
    ]);
  });

  it('reports an absolute URL with a non-http scheme', () => {
    expect(run(canonicalRule, page(doc(link('ftp://example.com/file'))))).toEqual([
      {
        message: 'Canonical href "ftp://example.com/file" is not an absolute http(s) URL.',
        line: 4,
      },
    ]);
  });

  it('reports a URL that cannot be parsed', () => {
    expect(run(canonicalRule, page(doc(link('https://'))))).toEqual([
      { message: 'Canonical href "https://" is not an absolute http(s) URL.', line: 4 },
    ]);
  });
});
