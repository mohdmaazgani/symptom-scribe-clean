import { redis } from "./redis.ts";

type RequestRecord = {
  count: number;
  timestamp: number;
};

const requestStore = new Map<string, RequestRecord>();

const WINDOW_SIZE_MS = 60 * 1000;
const MAX_REQUESTS = 10;

function memoryRateLimit(ip: string): { success: boolean } {
  const now = Date.now();
  const existing = requestStore.get(ip);

  // Initialize or reset expired window
  if (!existing || now - existing.timestamp > WINDOW_SIZE_MS) {
    requestStore.set(ip, { count: 1, timestamp: now });
    return { success: true };
  }

  if (existing.count >= MAX_REQUESTS) {
    return { success: false };
  }

  requestStore.set(ip, {
    count: existing.count + 1,
    timestamp: existing.timestamp,
  });

  return { success: true };
}

export async function rateLimit(ip: string): Promise<{ success: boolean }> {
  if (redis) {
    try {
      const key = `ratelimit:${ip}`;
      // Atomic pipeline: INCR + EXPIRE NX
      const pipeline = redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, 60, "NX");
      const [count] = await pipeline.exec<[number, number]>();

      if (count > MAX_REQUESTS) {
        return { success: false };
      }
      return { success: true };
    } catch (error) {
      console.error("Redis rate limit error, falling back to local memory map:", error);
      return memoryRateLimit(ip);
    }
  }

  return memoryRateLimit(ip);
}
