export const MAX_RETRY_ATTEMPTS = 6;
const MAX_BACKOFF_MS = 30_000;

export function calculateNextRetryDelayMs(attempt: number): number {
  if (attempt <= 0) return 1000;
  // attempt 1 -> 1s, 2 -> 2s, 3 -> 4s, 4 -> 8s, 5 -> 16s, 6+ -> 30s
  const base = 1000 * Math.pow(2, attempt - 1);
  if (attempt >= 6) return MAX_BACKOFF_MS;
  return Math.min(base, MAX_BACKOFF_MS);
}

export function isRetryableError(err: unknown): boolean {
  // Network/fetch failures: those often come as TypeError or have no "status"
  if (!err) return false;
  // If it's a plain Error with no status, assume network/fetch -> retryable
  if (err instanceof Error) {
    const anyErr = err as unknown as Record<string, unknown>;
    const name = anyErr["name"] as unknown as string | undefined;
    const statusField = anyErr["status"] ?? anyErr["statusCode"] ?? anyErr["status_code"];
    const codeField = anyErr["code"] as unknown as string | undefined;
    const messageField = anyErr["message"] as unknown as string | undefined;

    if (name === "TypeError" && statusField === undefined) return true;
    if (typeof codeField === "string" && codeField.startsWith("PGRST5")) return true;
    // Supabase client sometimes surfaces status/statusCode
    if (typeof statusField === "number") {
      if (statusField >= 500 && statusField < 600) return true;
      if (statusField === 408) return true;
      return false;
    }
    // Fallback: if error message contains typical 5xx text, retry
    if (typeof messageField === "string") {
      if (/5\d{2}/.test(messageField)) return true;
      if (/timeout|timed out|network/i.test(messageField)) return true;
    }
    return false;
  }

  // Non-Error objects: inspect common shapes
  try {
    const asObj = err as unknown as Record<string, unknown>;
    const status = asObj["status"] ?? asObj["statusCode"] ?? asObj["code"];
    if (typeof status === "number") return status >= 500 && status < 600;
    if (typeof status === "string") {
      if (status.startsWith("5")) return true;
      return false;
    }
  } catch (e) {
    return false;
  }

  return false;
}
