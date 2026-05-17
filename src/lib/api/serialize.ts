/**
 * API serialization helpers.
 *
 * Replace `as unknown as Record<string, unknown>` assertions in service files
 * with these typed helpers so the intent is explicit and the surface for bugs
 * stays minimal.
 */

/**
 * Convert a typed payload object to the generic Record that Axios / fetch
 * request body parameters accept. This is a zero-runtime-cost cast — it only
 * eliminates the `as unknown` double assertion.
 */
export function toBody<T extends object>(payload: T): Record<string, unknown> {
  return payload as unknown as Record<string, unknown>;
}

/**
 * Safely read an unknown API response field as a string.
 * Returns undefined if the field is missing or not a string.
 */
export function safeString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Safely read an unknown API response field as a number.
 */
export function safeNumber(value: unknown): number | undefined {
  return typeof value === 'number' && !Number.isNaN(value) ? value : undefined;
}

/**
 * Safely read an unknown API response field as a boolean.
 */
export function safeBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}
