/**
 * Sanitizes user-generated text content to prevent XSS attacks.
 * Escapes HTML control characters and strips dangerous script tags, handlers, and JavaScript URIs.
 */
export function sanitizeContent(input: string): string {
  if (!input || typeof input !== "string") return "";

  // 1. Strip script tags and their contents
  let clean = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // 2. Strip event handlers (e.g., onload, onerror, onclick)
  clean = clean.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  clean = clean.replace(/on\w+\s*=\s*[^ >]+/gi, "");

  // 3. Strip javascript: URIs
  clean = clean.replace(/javascript:[^\s"']+/gi, "");

  // 4. Escape HTML special characters
  const htmlMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  clean = clean.replace(/[&<>"'/]/g, (char) => htmlMap[char] || char);

  return clean.trim();
}

/**
 * Decodes sanitized HTML entities back to raw text for display in standard React text nodes safely.
 */
export function unescapeSanitized(input: string): string {
  if (!input) return "";
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}
