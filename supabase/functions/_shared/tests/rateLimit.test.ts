import { rateLimit } from "../rateLimit.ts";

Deno.test("Rate Limiter - Local Memory Fallback Test", async () => {
  const testIp = "127.0.0.1";
  const result = await rateLimit(testIp);
  if (typeof result.success !== "boolean") {
    throw new Error("Rate limit result should return boolean success property");
  }
});

Deno.test("Rate Limiter - Abort Signal Test", async () => {
  const controller = new AbortController();
  controller.abort(new Error("Client test abort"));
  
  const result = await rateLimit("192.168.1.100", controller.signal);
  if (typeof result.success !== "boolean") {
    throw new Error("Rate limiter should fail open gracefully on client abort");
  }
});
