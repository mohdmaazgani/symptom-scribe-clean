import { redis } from "./redis.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

type RequestRecord = {
  count: number;
  timestamp: number;
};

const requestStore = new Map<string, RequestRecord>();

const WINDOW_SIZE_MS = 60 * 1000;
const MAX_REQUESTS = 10;
let warnedAboutFallback = false;

// Fallback 1: Database-backed global rate limiter (handles multi-isolate environments)
async function databaseRateLimit(ip: string): Promise<{ success: boolean }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return memoryRateLimit(ip);
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
      client_ip: ip,
      max_requests: MAX_REQUESTS,
      window_size_seconds: 60,
    });

    if (error) throw error;
    return { success: Boolean(data) };
  } catch (err) {
    console.error("Database rate limit error, falling back to local memory map:", err);
    return memoryRateLimit(ip);
  }
}

// Fallback 2: Local memory map rate limiter (isolated per serverless instance)
function memoryRateLimit(ip: string): { success: boolean } {
  if (!warnedAboutFallback) {
    warnedAboutFallback = true;
    console.warn(
      "[rateLimit] Redis is not configured or unreachable — falling back to database/local rate limiter."
    );
  }
  const now = Date.now();
  const existing = requestStore.get(ip);
  
  if (!existing || now - existing.timestamp > WINDOW_SIZE_MS) {
    if (existing) requestStore.delete(ip);
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
      const pipeline = redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, 60, "NX");
      const [count] = await pipeline.exec<[number, number]>();

      if (count > MAX_REQUESTS) {
        return { success: false };
      }
      return { success: true };
    } catch (error) {
      console.error("Redis rate limit error, falling back to database/local map:", error);
      return await databaseRateLimit(ip);
    }
  }

  return await databaseRateLimit(ip);
}
