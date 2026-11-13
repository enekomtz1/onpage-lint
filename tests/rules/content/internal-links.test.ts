import { describe, expect, it } from 'vitest';
import { internalLinks } from '../../../src/rules/content/internal-links.js';
import { doc, run } from './helpers.js';

const files = [
  'index.html',
  'about/index.html',
  'contact.html',
  'blog/index.html',
  'blog/post.html',
  'blog/first post.html',
  'docs/guide.html',
  'assets/logo.png',
  'café/index.html',
];

function check(href: string, relativePath = 'index.html') {
  return run(internalLinks, doc(`<a href="${href}">Link</a>`), { relativePath, files });
}

describe('internal-links', () => {
  it('has the expected metadata', () => {
    expect(internalLinks.id).toBe('internal-links');
    expect(internalLinks.severity).toBe('error');
  });

  it.each([
    '',
    '#',
    '#section',
    'https://example.com/missing',
    'http://example.com/',
    'HTTPS://EXAMPLE.COM/',
    'mailto:hello@example.com',
    'tel:+10000000000',
    'javascript:void(0)',
    '//cdn.example.com/lib.js',
    'data:text/plain,hello',
  ])('ignores the href %j', (href) => {
    expect(check(href)).toEqual([]);
  });

  it('ignores <a> elements without href', () => {
    expect(run(internalLinks, doc('<a name="top">Top</a>'), { files })).toEqual([]);
  });

  it.each([
    ['contact.html', 'index.html'],
    ['/contact.html', 'blog/post.html'],
    ['assets/logo.png', 'index.html'],
    ['/', 'blog/post.html'],
    ['./', 'index.html'],
    ['index.html', 'index.html'],
    ['/about/', 'index.html'],
    ['../about/', 'blog/post.html'],
    ['../', 'blog/post.html'],
    ['..', 'blog/post.html'],
    ['.', 'blog/post.html'],
    ['post.html', 'blog/index.html'],
    ['./post.html', 'blog/index.html'],
    ['../docs/./guide.html', 'blog/post.html'],
  ])('resolves %j from %s', (href, from) => {
    expect(check(href, from)).toEqual([]);
  });

  it.each([
    ['/about', 'about/index.html'],
    ['/contact', 'contact.html'],
    ['../blog/post', 'blog/post.html'],
    ['/blog', 'blog/index.html'],
  ])('accepts the clean URL %j (served by %s)', (href) => {
    expect(check(href, 'blog/post.html')).toEqual([]);
  });

  it('strips the query string and fragment', () => {
    expect(check('/contact.html?ref=footer#form')).toEqual([]);
    expect(check('/about/#team')).toEqual([]);
    expect(check('?page=2')).toEqual([]);
  });

  it('percent-decodes the path', () => {
    expect(check('/blog/first%20post.html')).toEqual([]);
    expect(check('/caf%C3%A9/')).toEqual([]);
  });

  it('reports a missing target with the href and line', () => {
    const html = doc('<p>Intro</p>\n<a href="/pricing/">Pricing</a>');

    expect(run(internalLinks, html, { files })).toEqual([
      { message: 'Broken internal link "/pricing/": pricing/index.html does not exist.', line: 6 },
    ]);
  });

  it('reports a missing relative target from a nested page', () => {
    expect(check('../team/', 'blog/post.html')).toEqual([
      { message: 'Broken internal link "../team/": team/index.html does not exist.', line: 5 },
    ]);
  });

  it('reports a missing clean URL by its path', () => {
    expect(check('/pricing')).toEqual([
      { message: 'Broken internal link "/pricing": pricing does not exist.', line: 5 },
    ]);
  });

  it('does not treat a directory link as a file with the same name', () => {
    expect(check('/contact/')).toEqual([
      { message: 'Broken internal link "/contact/": contact/index.html does not exist.', line: 5 },
    ]);
  });

  it('does not decode the path twice', () => {
    expect(check('/blog/first%2520post.html')).toEqual([
      {
        message:
          'Broken internal link "/blog/first%2520post.html": blog/first%20post.html does not exist.',
        line: 5,
      },
    ]);
  });

  it('reports a link that climbs above the site root', () => {
    expect(check('../../outside.html', 'blog/post.html')).toEqual([
      { message: 'Internal link "../../outside.html" points above the site root.', line: 5 },
    ]);
    expect(check('/../index.html')).toEqual([
      { message: 'Internal link "/../index.html" points above the site root.', line: 5 },
    ]);
  });

  it('reports invalid percent-encoding', () => {
    expect(check('/100%.html')).toEqual([
      { message: 'Internal link "/100%.html" has invalid percent-encoding.', line: 5 },
    ]);
  });

  it('reports every broken link on the page', () => {
    const html = doc('<a href="/a">A</a>\n<a href="/contact">OK</a>\n<a href="b.html">B</a>');

    expect(run(internalLinks, html, { files }).map((result) => result.line)).toEqual([5, 7]);
  });
});
