import { describe, expect, it } from 'vitest';
import { titleRule } from '../../../src/rules/head/title.js';
import { doc, page, run } from './fixtures.js';

const GOOD = 'Handmade ceramic mugs and bowls';

describe('title', () => {
  it('has id title and default severity error', () => {
    expect(titleRule.id).toBe('title');
    expect(titleRule.severity).toBe('error');
  });

  it('passes for a single title of a reasonable length', () => {
    expect(run(titleRule, page(doc(`    <title>${GOOD}</title>`)))).toEqual([]);
  });

  it('reports a missing title', () => {
    expect(run(titleRule, page(doc('    <meta charset="utf-8">')))).toEqual([
      { message: 'Missing <title> in <head>.' },
    ]);
  });

  it('ignores a title outside the head', () => {
    const html = doc('').replace('<h1>Example</h1>', `<svg><title>${GOOD}</title></svg>`);
    expect(run(titleRule, page(html))).toEqual([{ message: 'Missing <title> in <head>.' }]);
  });

  it('reports an empty or whitespace-only title with its line', () => {
    expect(run(titleRule, page(doc('    <title>   </title>')))).toEqual([
      { message: '<title> is empty.', line: 4 },
    ]);
  });

  it('reports more than one title, pointing at the second', () => {
    const html = doc(`    <title>${GOOD}</title>\n    <title>Another title here</title>`);
    expect(run(titleRule, page(html))).toEqual([
      { message: 'Found 2 <title> elements in <head>; expected exactly one.', line: 5 },
    ]);
  });

  it('warns when the title is too short', () => {
    expect(run(titleRule, page(doc('    <title> Mugs </title>')))).toEqual([
      {
        message: 'Title is 4 characters long; aim for 10 to 60.',
        line: 4,
        severity: 'warning',
      },
    ]);
  });

  it('warns when the title is too long', () => {
    const long = 'a'.repeat(61);
    expect(run(titleRule, page(doc(`    <title>${long}</title>`)))).toEqual([
      {
        message: 'Title is 61 characters long; aim for 10 to 60.',
        line: 4,
        severity: 'warning',
      },
    ]);
  });

  it('accepts titles at the length limits', () => {
    expect(run(titleRule, page(doc(`    <title>${'a'.repeat(10)}</title>`)))).toEqual([]);
    expect(run(titleRule, page(doc(`    <title>${'a'.repeat(60)}</title>`)))).toEqual([]);
  });

  it('warns when another page has the same trimmed title, naming it', () => {
    const target = page(doc(`    <title>${GOOD}</title>`), 'index.html');
    const twin = page(doc(`    <title>  ${GOOD} </title>`), 'shop/index.html');
    const other = page(doc('    <title>A different page title</title>'), 'about.html');

    expect(run(titleRule, target, twin, other)).toEqual([
      {
        message: `Title "${GOOD}" is also used by shop/index.html.`,
        line: 4,
        severity: 'warning',
      },
    ]);
  });

  it('names every other page that shares the title', () => {
    const target = page(doc(`    <title>${GOOD}</title>`), 'index.html');
    const a = page(doc(`    <title>${GOOD}</title>`), 'a.html');
    const b = page(doc(`    <title>${GOOD}</title>`), 'b.html');

    expect(run(titleRule, target, a, b)[0]?.message).toBe(
      `Title "${GOOD}" is also used by a.html, b.html.`,
    );
  });

  it('does not treat empty titles on several pages as duplicates', () => {
    const target = page(doc('    <title></title>'), 'index.html');
    const twin = page(doc('    <title></title>'), 'b.html');

    expect(run(titleRule, target, twin)).toEqual([{ message: '<title> is empty.', line: 4 }]);
  });
});
