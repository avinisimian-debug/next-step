/** Only same-site relative paths are allowed as post-login destinations (no open redirects). */
export function safeNext(value: unknown, fallback = "/account"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\r\n]/.test(value) || value.length > 300) return fallback;
  return value;
}

/** Builds the login URL that brings the visitor back to `path` afterwards. */
export const loginHref = (path: string) => `/login?next=${encodeURIComponent(safeNext(path, "/"))}`;
