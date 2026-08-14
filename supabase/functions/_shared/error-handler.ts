export type ErrorCode =
  | "AUTH_REQUIRED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_ERROR";

export const ErrorCodes = {
  AUTH_REQUIRED: "AUTH_REQUIRED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export class AppError extends Error {
  code: ErrorCode;
  status: number;
  safeMessage: string;
  internal?: unknown;

  constructor(code: ErrorCode, safeMessage: string, status: number, internal?: unknown) {
    super(safeMessage);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.safeMessage = safeMessage;
    this.internal = internal;
  }
}

function createErrorResponse(code: ErrorCode, message: string, status = 500, headers: Record<string, string> = {}) {
  const body = {
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
    },
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

export function handleError(error: unknown, headers: Record<string, string> = {}) {
  if (error instanceof AppError) {
    // Log internal details server-side but never expose them to clients
    if (error.internal) console.error("AppError internal:", error.code, error.internal);
    else console.error("AppError:", error.code, error.safeMessage);

    return createErrorResponse(error.code, error.safeMessage, error.status, headers);
  }

  // Known Error-like objects (e.g., from libs) should NOT leak details
  console.error("Unhandled error:", error);
  return createErrorResponse(ErrorCodes.INTERNAL_ERROR, "Internal server error", 500, headers);
}

export default {
  AppError,
  ErrorCodes,
  handleError,
};
