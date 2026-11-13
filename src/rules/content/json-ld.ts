import { lineOf } from '../../page.js';
import type { Rule, RuleResult } from '../../types.js';
import { normalizeAttr } from './attributes.js';

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Returns the top-level objects of a JSON-LD value, or `undefined` if its shape is wrong. */
function topLevelObjects(value: unknown): JsonObject[] | undefined {
  if (isObject(value)) return [value];
  if (Array.isArray(value) && value.length > 0 && value.every(isObject)) return value;
  return undefined;
}

export const jsonLd: Rule = {
  id: 'json-ld',
  description: 'JSON-LD blocks are valid JSON objects with @context and @type or @graph.',
  severity: 'error',
  check(page) {
    const { $ } = page;
    const results: RuleResult[] = [];
    for (const script of $('script[type]').toArray()) {
      if (normalizeAttr($(script).attr('type')) !== 'application/ld+json') continue;
      const line = lineOf(script);
      const content = $(script).text();

      if (content.trim() === '') {
        results.push({ message: 'JSON-LD block is empty.', line });
        continue;
      }

      let value: unknown;
      try {
        value = JSON.parse(content);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        results.push({ message: `JSON-LD is not valid JSON: ${reason}`, line });
        continue;
      }

      const objects = topLevelObjects(value);
      if (!objects) {
        results.push({ message: 'JSON-LD must be an object or an array of objects.', line });
        continue;
      }

      objects.forEach((object, index) => {
        const subject = Array.isArray(value) ? `JSON-LD item ${index + 1}` : 'JSON-LD object';
        if (!('@context' in object)) {
          results.push({ message: `${subject} has no @context.`, line, severity: 'warning' });
        }
        if (!('@type' in object) && !('@graph' in object)) {
          results.push({
            message: `${subject} has neither @type nor @graph.`,
            line,
            severity: 'warning',
          });
        }
      });
    }
    return results;
  },
};
