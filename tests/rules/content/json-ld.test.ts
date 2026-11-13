import { describe, expect, it } from 'vitest';
import { jsonLd } from '../../../src/rules/content/json-ld.js';
import { doc, run } from './helpers.js';

function script(content: string, type = 'application/ld+json'): string {
  return doc(`<script type="${type}">${content}</script>`);
}

describe('json-ld', () => {
  it('has the expected metadata', () => {
    expect(jsonLd.id).toBe('json-ld');
    expect(jsonLd.severity).toBe('error');
  });

  it('passes for a valid object', () => {
    const json = '{"@context": "https://schema.org", "@type": "Organization", "name": "Example"}';
    expect(run(jsonLd, script(json))).toEqual([]);
  });

  it('passes for an object with @graph and no @type', () => {
    const json = '{"@context": "https://schema.org", "@graph": [{"@type": "WebSite"}]}';
    expect(run(jsonLd, script(json))).toEqual([]);
  });

  it('passes for an array of valid objects', () => {
    const json =
      '[{"@context": "https://schema.org", "@type": "WebSite"}, {"@context": "https://schema.org", "@type": "Person"}]';
    expect(run(jsonLd, script(json))).toEqual([]);
  });

  it('matches the type attribute case-insensitively', () => {
    expect(run(jsonLd, script('not json', 'Application/LD+JSON'))).toHaveLength(1);
  });

  it('ignores other scripts', () => {
    expect(run(jsonLd, script('not json', 'application/json'))).toEqual([]);
    expect(run(jsonLd, doc('<script>let a = {</script>'))).toEqual([]);
  });

  it('reports an empty block', () => {
    expect(run(jsonLd, script('  \n  '))).toEqual([
      { message: 'JSON-LD block is empty.', line: 5 },
    ]);
  });

  it('reports invalid JSON with the parser message', () => {
    const results = run(jsonLd, script('{"@type": "Thing",}'));

    expect(results).toHaveLength(1);
    expect(results[0]?.line).toBe(5);
    expect(results[0]?.severity).toBeUndefined();
    expect(results[0]?.message).toMatch(/^JSON-LD is not valid JSON: .+/);
  });

  it.each(['"text"', '42', 'null', 'true', '[]', '[1, 2]', '[{"@type": "Thing"}, "text"]'])(
    'reports %s as not an object or array of objects',
    (json) => {
      expect(run(jsonLd, script(json))).toEqual([
        { message: 'JSON-LD must be an object or an array of objects.', line: 5 },
      ]);
    },
  );

  it('warns about a missing @context', () => {
    expect(run(jsonLd, script('{"@type": "Organization"}'))).toEqual([
      { message: 'JSON-LD object has no @context.', line: 5, severity: 'warning' },
    ]);
  });

  it('warns about a missing @type and @graph', () => {
    expect(run(jsonLd, script('{"@context": "https://schema.org"}'))).toEqual([
      { message: 'JSON-LD object has neither @type nor @graph.', line: 5, severity: 'warning' },
    ]);
  });

  it('names the array item that has problems', () => {
    const json = '[{"@context": "https://schema.org", "@type": "WebSite"}, {"name": "Example"}]';

    expect(run(jsonLd, script(json))).toEqual([
      { message: 'JSON-LD item 2 has no @context.', line: 5, severity: 'warning' },
      { message: 'JSON-LD item 2 has neither @type nor @graph.', line: 5, severity: 'warning' },
    ]);
  });

  it('checks every block on the page with its own line', () => {
    const html = doc(
      [
        '<script type="application/ld+json">{"@context": "https://schema.org", "@type": "Thing"}</script>',
        '<p>Text</p>',
        '<script type="application/ld+json">',
        '{ broken',
        '</script>',
      ].join('\n'),
    );

    const results = run(jsonLd, html);
    expect(results).toHaveLength(1);
    expect(results[0]?.line).toBe(7);
  });
});
