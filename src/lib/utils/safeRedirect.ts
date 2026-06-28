/**
 * Validates a `?redirect=` query param so it can only ever send the user to
 * a same-origin relative path — prevents an open-redirect via a crafted
 * absolute or protocol-relative URL (e.g. `?redirect=https://evil.com`).
 */
export function safeRedirect(path: string | null | undefined): string {
  if (!path) return "/";
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}
