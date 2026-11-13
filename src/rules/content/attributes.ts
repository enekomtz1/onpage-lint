/** Normalizes an enumerated attribute value (`type`, `role`, …) for comparison. */
export function normalizeAttr(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}
