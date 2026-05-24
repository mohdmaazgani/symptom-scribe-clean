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

    // First request
    if (!existing) {
        requestStore.set(ip, {
            count: 1,
            timestamp: now,
        });

        return { success: true };
    }

    // Reset window
    if (now - existing.timestamp > WINDOW_SIZE_MS) {
        requestStore.set(ip, {
            count: 1,
            timestamp: now,
        });

        return { success: true };
    }

    // Block request
    if (existing.count >= MAX_REQUESTS) {
        return { success: false };
    }

    // Increment safely
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
            const count = await redis.incr(key);
            if (count === 1) {
                await redis.expire(key, 60);
            }
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