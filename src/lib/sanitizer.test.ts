import { describe, it, expect } from "vitest";
import { sanitizeContent, unescapeSanitized } from "./sanitizer";

describe("sanitizer utility", () => {
  it("strips malicious script tags", () => {
    const malicious = '<script>alert("XSS")</script>Hello World';
    const sanitized = sanitizeContent(malicious);
    expect(sanitized).not.toContain("<script>");
    expect(sanitized).not.toContain("alert");
    expect(sanitized).toContain("Hello World");
  });

  it("strips event handlers", () => {
    const malicious = '<img src="x" onerror="alert(1)" />Good day';
    const sanitized = sanitizeContent(malicious);
    expect(sanitized).not.toContain("onerror=");
  });

  it("escapes HTML special characters", () => {
    const input = '<b>"Test" & \'More\'</b>';
    const sanitized = sanitizeContent(input);
    expect(sanitized).toContain("&lt;b&gt;");
    expect(sanitized).toContain("&quot;Test&quot;");
    expect(sanitized).toContain("&amp;");
  });

  it("decodes escaped HTML back safely for display", () => {
    const raw = "Hello & World";
    const sanitized = sanitizeContent(raw);
    const decoded = unescapeSanitized(sanitized);
    expect(decoded).toBe("Hello & World");
  });
});
