import { describe, expect, it } from 'vitest';
import { h1 } from '../../../src/rules/content/h1.js';
import { doc, run } from './helpers.js';

describe('h1', () => {
  it('has the expected metadata', () => {
    expect(h1.id).toBe('h1');
    expect(h1.severity).toBe('error');
  });

  it('passes with a single h1 that has text', () => {
    expect(run(h1, doc('<h1>Welcome to the example shop</h1>'))).toEqual([]);
  });

  it('passes when the h1 text is nested in other elements', () => {
    expect(run(h1, doc('<h1><a href="/"><span>Example</span></a></h1>'))).toEqual([]);
  });

  it('reports a page without an h1', () => {
    expect(run(h1, doc('<h2>Only a subheading</h2>'))).toEqual([{ message: 'Page has no <h1>.' }]);
  });

  it('reports an empty h1 with its line', () => {
    expect(run(h1, doc('<p>Intro</p>\n<h1>  </h1>'))).toEqual([
      { message: '<h1> has no text.', line: 6 },
    ]);
  });

  it('treats an h1 with only non-breaking spaces as empty', () => {
    expect(run(h1, doc('<h1>&nbsp;</h1>'))).toEqual([{ message: '<h1> has no text.', line: 5 }]);
  });

  it('accepts the alt text of an image inside the h1 as text', () => {
    expect(run(h1, doc('<h1><img src="/logo.png" alt="Example Shop"></h1>'))).toEqual([]);
  });

  it('reports an h1 whose only image has an empty alt', () => {
    expect(run(h1, doc('<h1><img src="/logo.png" alt=""></h1>'))).toEqual([
      { message: '<h1> has no text.', line: 5 },
    ]);
  });

  it('warns about every h1 after the first', () => {
    const html = doc('<h1>First</h1>\n<h1>Second</h1>\n<h1>Third</h1>');

    expect(run(h1, html)).toEqual([
      {
        message: 'Page has more than one <h1> (first on line 5).',
        line: 6,
        severity: 'warning',
      },
      {
        message: 'Page has more than one <h1> (first on line 5).',
        line: 7,
        severity: 'warning',
      },
    ]);
  });

  it('reports both problems for an extra empty h1', () => {
    const html = doc('<h1>First</h1>\n<h1></h1>');

    expect(run(h1, html)).toEqual([
      { message: '<h1> has no text.', line: 6 },
      {
        message: 'Page has more than one <h1> (first on line 5).',
        line: 6,
        severity: 'warning',
      },
    ]);
  });
});
