import { Redis } from "https://esm.sh/@upstash/redis";

type RequestRecord = {
    count: number;
    timestamp: number;
};

const requestStore = new Map<string, RequestRecord>();

const WINDOW_SIZE_MS = 60 * 1000;
const MAX_REQUESTS = 10;

const redisUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
const redisToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

let redis: Redis | null = null;
if (redisUrl && redisToken) {
  try {
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  } catch (error) {
    console.error("Failed to initialize Upstash Redis:", error);
  }
}

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
            // Atomic pipeline: INCR + EXPIRE NX fixes two bugs:
            // 1. Race condition — a crash between INCR and EXPIRE would leave the key
            //    without a TTL, permanently rate-limiting that IP.
            // 2. Off-by-one — the old `count === 1` guard was fragile; EXPIRE NX sets
            //    the TTL exactly once (when no TTL exists) regardless of count value.
            const pipeline = redis.pipeline();
            pipeline.incr(key);
            pipeline.expire(key, 60, "NX");
            const results = await pipeline.exec();
            const count = results[0] as number;

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