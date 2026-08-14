import { describe, it, expect } from "vitest";
import { AppError, ErrorCodes, handleError } from "./error-handler.ts";

async function readJson(res: Response) {
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

describe("error-handler", () => {
  it("maps AppError AUTH_REQUIRED to 401 and shape", async () => {
    const res = handleError(new AppError(ErrorCodes.AUTH_REQUIRED, "Auth required", 401));
    expect(res.status).toBe(401);
    const body = await readJson(res);
    expect(body).toHaveProperty("error");
    expect(body.error.code).toBe(ErrorCodes.AUTH_REQUIRED);
    expect(body.error.message).toBe("Auth required");
    expect(body.error.timestamp).toBeTruthy();
  });

  it("maps VALIDATION_ERROR to 400", async () => {
    const res = handleError(new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid input", 400));
    expect(res.status).toBe(400);
    const body = await readJson(res);
    expect(body.error.code).toBe(ErrorCodes.VALIDATION_ERROR);
  });

  it("maps NOT_FOUND to 404", async () => {
    const res = handleError(new AppError(ErrorCodes.NOT_FOUND, "Not found", 404));
    expect(res.status).toBe(404);
    const body = await readJson(res);
    expect(body.error.code).toBe(ErrorCodes.NOT_FOUND);
  });

  it("maps RATE_LIMIT_EXCEEDED to 429", async () => {
    const res = handleError(new AppError(ErrorCodes.RATE_LIMIT_EXCEEDED, "Too many requests", 429));
    expect(res.status).toBe(429);
    const body = await readJson(res);
    expect(body.error.code).toBe(ErrorCodes.RATE_LIMIT_EXCEEDED);
  });

  it("unknown Error becomes INTERNAL_ERROR 500 without leaking details", async () => {
    const res = handleError(new Error("secret-db-error: password=abcd"));
    expect(res.status).toBe(500);
    const body = await readJson(res);
    expect(body.error.code).toBe(ErrorCodes.INTERNAL_ERROR);
    expect(body.error.message).toBe("Internal server error");
    expect(body.error.timestamp).toBeTruthy();
    // ensure sensitive string not present
    const raw = JSON.stringify(body);
    expect(raw).not.toContain("secret-db-error");
    expect(raw).not.toContain("password=abcd");
  });
});
