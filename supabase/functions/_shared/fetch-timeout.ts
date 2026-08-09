/**
 * Bounded fetch utility with automatic AbortSignal propagation and timeout protection.
 */
export async function fetchWithTimeout(
  url: string | URL | Request,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 3000, signal: parentSignal, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Fetch timeout exceeded (${timeoutMs}ms)`));
  }, timeoutMs);

  let combinedSignal = controller.signal;

  if (parentSignal) {
    if (parentSignal.aborted) {
      controller.abort(parentSignal.reason);
    } else {
      parentSignal.addEventListener("abort", () => {
        controller.abort(parentSignal.reason);
      });
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: combinedSignal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
