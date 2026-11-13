import { describe, expect, it } from 'vitest';
import { metaDescriptionRule } from '../../../src/rules/head/meta-description.js';
import { doc, page, run } from './fixtures.js';

const GOOD = 'Handmade ceramic mugs and bowls, glazed in small batches and shipped worldwide.';
const meta = (content: string, name = 'description') =>
  `    <meta name="${name}" content="${content}">`;

describe('meta-description', () => {
  it('has id meta-description and default severity error', () => {
    expect(metaDescriptionRule.id).toBe('meta-description');
    expect(metaDescriptionRule.severity).toBe('error');
  });

  it('passes for a single description of a reasonable length', () => {
    expect(run(metaDescriptionRule, page(doc(meta(GOOD))))).toEqual([]);
  });

  it('matches the name attribute case-insensitively', () => {
    expect(run(metaDescriptionRule, page(doc(meta(GOOD, 'Description'))))).toEqual([]);
    expect(
      run(metaDescriptionRule, page(doc(`    <META NAME="DESCRIPTION" CONTENT="${GOOD}">`))),
    ).toEqual([]);
  });

  it('reports a missing description', () => {
    expect(run(metaDescriptionRule, page(doc('    <title>Example page</title>')))).toEqual([
      { message: 'Missing <meta name="description"> in <head>.' },
    ]);
  });

  it('reports an empty or missing content attribute with its line', () => {
    expect(run(metaDescriptionRule, page(doc(meta('  '))))).toEqual([
      { message: 'Meta description is empty.', line: 4 },
    ]);
    expect(run(metaDescriptionRule, page(doc('    <meta name="description">')))).toEqual([
      { message: 'Meta description is empty.', line: 4 },
    ]);
  });

  it('reports more than one description, pointing at the second', () => {
    const html = doc(`${meta(GOOD)}\n${meta(GOOD)}`);
    expect(run(metaDescriptionRule, page(html))).toEqual([
      {
        message: 'Found 2 <meta name="description"> elements; expected exactly one.',
        line: 5,
      },
    ]);
  });

  it('warns when the description is too short', () => {
    expect(run(metaDescriptionRule, page(doc(meta('Ceramic mugs.'))))).toEqual([
      {
        message: 'Meta description is 13 characters long; aim for 50 to 160.',
        line: 4,
        severity: 'warning',
      },
    ]);
  });

  it('warns when the description is too long', () => {
    expect(run(metaDescriptionRule, page(doc(meta('a'.repeat(161)))))).toEqual([
      {
        message: 'Meta description is 161 characters long; aim for 50 to 160.',
        line: 4,
        severity: 'warning',
      },
    ]);
  });

  it('accepts descriptions at the length limits', () => {
    expect(run(metaDescriptionRule, page(doc(meta('a'.repeat(50)))))).toEqual([]);
    expect(run(metaDescriptionRule, page(doc(meta('a'.repeat(160)))))).toEqual([]);
  });

  it('warns when another page has the same description, naming it', () => {
    const target = page(doc(meta(GOOD)), 'index.html');
    const twin = page(doc(meta(` ${GOOD} `, 'DESCRIPTION')), 'shop/index.html');
    const other = page(doc(meta(`${GOOD} Now with free returns.`)), 'about.html');

    expect(run(metaDescriptionRule, target, twin, other)).toEqual([
      {
        message: 'Meta description is also used by shop/index.html.',
        line: 4,
        severity: 'warning',
      },
    ]);
  });

  it('does not treat empty descriptions on several pages as duplicates', () => {
    const target = page(doc(meta('')), 'index.html');
    const twin = page(doc(meta('')), 'b.html');

    expect(run(metaDescriptionRule, target, twin)).toEqual([
      { message: 'Meta description is empty.', line: 4 },
    ]);
  });
});
