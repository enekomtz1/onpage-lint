import { describe, expect, it } from 'vitest';
import { createPage, createSite, lineOf } from '../src/page.js';

const html = `<!doctype html>
<html lang="en">
  <head>
    <title>Example</title>
  </head>
  <body>
    <h1>Hello</h1>
  </body>
</html>
`;

describe('createPage', () => {
  it('parses the HTML and keeps the relative path', () => {
    const page = createPage({ rootDir: '/site', relativePath: 'blog/index.html', html });

    expect(page.relativePath).toBe('blog/index.html');
    expect(page.html).toBe(html);
    expect(page.$('title').text()).toBe('Example');
  });
});

describe('lineOf', () => {
  it('returns the 1-based line where an element starts', () => {
    const page = createPage({ rootDir: '/site', relativePath: 'index.html', html });

    expect(lineOf(page.$('title').get(0))).toBe(4);
    expect(lineOf(page.$('h1').get(0))).toBe(7);
  });

  it('returns undefined when there is no node', () => {
    expect(lineOf(undefined)).toBeUndefined();
  });
});

describe('createSite', () => {
  it('sorts pages and defaults files to the page paths', () => {
    const b = createPage({ rootDir: '/site', relativePath: 'b.html', html });
    const a = createPage({ rootDir: '/site', relativePath: 'a.html', html });

    const site = createSite('/site', [b, a]);

    expect(site.pages.map((page) => page.relativePath)).toEqual(['a.html', 'b.html']);
    expect([...site.files]).toEqual(['a.html', 'b.html']);
  });

  it('uses the given file list when provided', () => {
    const site = createSite('/site', [], ['logo.png']);

    expect(site.files.has('logo.png')).toBe(true);
  });
});
