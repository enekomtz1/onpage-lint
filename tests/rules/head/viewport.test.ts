import { describe, expect, it } from 'vitest';
import { viewportRule } from '../../../src/rules/head/viewport.js';
import { doc, page, run } from './fixtures.js';

const meta = (content: string, name = 'viewport') =>
  `    <meta name="${name}" content="${content}">`;

describe('viewport', () => {
  it('has id viewport and default severity error', () => {
    expect(viewportRule.id).toBe('viewport');
    expect(viewportRule.severity).toBe('error');
  });

  it.each([
    'width=device-width, initial-scale=1',
    'initial-scale=1,width=device-width',
    'width = device-width',
    'WIDTH=DEVICE-WIDTH',
  ])('accepts content="%s"', (content) => {
    expect(run(viewportRule, page(doc(meta(content))))).toEqual([]);
  });

  it('matches the name attribute case-insensitively', () => {
    expect(run(viewportRule, page(doc(meta('width=device-width', 'Viewport'))))).toEqual([]);
  });

  it('reports a missing viewport meta tag', () => {
    expect(run(viewportRule, page(doc('    <title>Example page</title>')))).toEqual([
      { message: 'Missing <meta name="viewport"> in <head>.' },
    ]);
  });

  it.each(['width=1024', 'initial-scale=1', '', 'min-width=device-width'])(
    'warns when content="%s" lacks width=device-width',
    (content) => {
      expect(run(viewportRule, page(doc(meta(content))))).toEqual([
        {
          message: `Viewport content "${content}" does not include width=device-width.`,
          line: 4,
          severity: 'warning',
        },
      ]);
    },
  );
});
