import type { Reporter } from '../types.js';
import { jsonReporter } from './json.js';
import { textReporter } from './text.js';

/** Output formats accepted by `--format`. */
export type FormatName = 'text' | 'json';

export const reporters: Record<FormatName, Reporter> = {
  text: textReporter,
  json: jsonReporter,
};

export function isFormatName(name: string): name is FormatName {
  return Object.hasOwn(reporters, name);
}
