import { describe, expect, it } from 'vitest';
import { imgAlt } from '../../../src/rules/content/img-alt.js';
import { doc, run } from './helpers.js';

describe('img-alt', () => {
  it('has the expected metadata', () => {
    expect(imgAlt.id).toBe('img-alt');
    expect(imgAlt.severity).toBe('error');
  });

  it('passes for images with alt text', () => {
    expect(run(imgAlt, doc('<img src="/cat.jpg" alt="A cat on a sofa">'))).toEqual([]);
  });

  it('allows an empty alt for decorative images', () => {
    expect(run(imgAlt, doc('<img src="/divider.svg" alt="">'))).toEqual([]);
  });

  it('allows an alt attribute without a value', () => {
    expect(run(imgAlt, doc('<img src="/divider.svg" alt>'))).toEqual([]);
  });

  it('reports each image without alt, with its src and line', () => {
    const html = doc('<img src="/a.jpg">\n<p>Text</p>\n<img src="/b.jpg">');

    expect(run(imgAlt, html)).toEqual([
      { message: '<img src="/a.jpg"> has no alt attribute.', line: 5 },
      { message: '<img src="/b.jpg"> has no alt attribute.', line: 7 },
    ]);
  });

  it('reports an image without src or alt', () => {
    expect(run(imgAlt, doc('<img>'))).toEqual([
      { message: '<img> without src has no alt attribute.', line: 5 },
    ]);
  });

  it.each([
    'role="presentation"',
    'role="none"',
    'role="Presentation"',
    'role=" NONE "',
    'aria-hidden="true"',
    'aria-hidden="TRUE"',
  ])('skips images marked with %s', (attr) => {
    expect(run(imgAlt, doc(`<img src="/pattern.png" ${attr}>`))).toEqual([]);
  });

  it('does not skip images with aria-hidden="false" or another role', () => {
    const html = doc('<img src="/a.png" aria-hidden="false">\n<img src="/b.png" role="img">');

    expect(run(imgAlt, html)).toEqual([
      { message: '<img src="/a.png"> has no alt attribute.', line: 5 },
      { message: '<img src="/b.png"> has no alt attribute.', line: 6 },
    ]);
  });
});
