/**
 * Sanitizes and validates callback URLs to prevent open-redirect vulnerabilities.
 * Only allows same-origin relative paths starting with a single '/' (e.g. "/resume", "/dashboard").
 * Disallows protocol-relative URLs ("//evil.com") and Windows-path style ("/\evil.com").
 */
export function getSafeCallbackUrl(raw: string | null, fallback = "/dashboard"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return fallback;
  }
  return raw;
}
