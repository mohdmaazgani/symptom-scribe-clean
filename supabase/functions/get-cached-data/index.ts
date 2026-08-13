import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { redis } from "../_shared/redis.ts";
import { rateLimit } from "../_shared/rateLimit.ts";
import { AppError, ErrorCodes, handleError } from "../_shared/error-handler.ts";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8080",
  "https://symptom-scribe.vercel.app",
  "https://symptom-scribe-clean.netlify.app",
];

const NETLIFY_PREVIEW_ORIGIN = /^https:\/\/deploy-preview-\d+--symptom-scribe-clean\.netlify\.app$/;

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.includes(origin) || NETLIFY_PREVIEW_ORIGIN.test(origin);
}

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin":
    origin && isAllowedOrigin(origin) ? origin : "null",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
});

serve(async (req) => {
  const origin = req.headers.get("origin");

    if (origin && !isAllowedOrigin(origin)) {
    return handleError(new AppError(ErrorCodes.VALIDATION_ERROR, "Origin not allowed", 403), {
      ...getCorsHeaders(origin),
    });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: getCorsHeaders(origin),
    });
  }

  try {
    // Rate limit check
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    const rateLimitResult = await rateLimit(ip);
    if (!rateLimitResult.success) {
      return handleError(
        new AppError(ErrorCodes.RATE_LIMIT_EXCEEDED, "Rate limit exceeded. Please try again later.", 429),
        getCorsHeaders(origin)
      );
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return handleError(new AppError(ErrorCodes.AUTH_REQUIRED, "Missing authorization header", 401), getCorsHeaders(origin));
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return handleError(new AppError(ErrorCodes.AUTH_REQUIRED, "Unauthorized", 401), getCorsHeaders(origin));
    }

    // Parse payload
    const body = await req.json();
    const { table } = body;
    const allowedTables = ["profiles", "symptom_history", "health_metrics", "chat_sessions"];

    if (!table || !allowedTables.includes(table)) {
      return handleError(
        new AppError(ErrorCodes.VALIDATION_ERROR, `Invalid or unsupported table. Must be one of: ${allowedTables.join(", ")}`, 400),
        getCorsHeaders(origin)
      );
    }

    // Try Redis Cache first
    const cacheKey = `cache:${user.id}:${table}`;
    let cachedData: string | null = null;

    if (redis) {
      try {
        cachedData = await redis.get(cacheKey);
      } catch (err) {
        console.error("Redis read error:", err);
      }
    }

    if (cachedData) {
      console.log(`Cache hit for ${cacheKey}`);
      // cachedData already has the { data, cachedAt } shape written below.
      return new Response(cachedData, {
        status: 200,
        headers: {
          ...getCorsHeaders(origin),
          "Content-Type": "application/json",
          "X-Cache": "HIT",
        },
      });
    }

    console.log(`Cache miss for ${cacheKey}. Fetching from Database...`);

    // Fetch from Supabase Database (passing authorization to enforce RLS)
    let query = supabaseClient.from(table).select("*").eq("user_id", user.id);

    // Sort order based on table types
    if (table === "symptom_history") {
      query = query.order("created_at", { ascending: false });
    } else if (table === "health_metrics") {
      query = query.order("recorded_at", { ascending: false });
    } else if (table === "chat_sessions") {
      query = query.order("updated_at", { ascending: false });
    }

    let dbData: unknown;
    if (table === "profiles") {
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      dbData = data;
    } else {
      const { data, error } = await query;
      if (error) throw error;
      dbData = data;
    }

    const cachedAt = new Date().toISOString();
    const responseBody = { data: dbData, cachedAt };
    const jsonString = JSON.stringify(responseBody);

    // Save to Redis Cache (TTL = 300 seconds).
    // We store `cachedAt` alongside the data itself so that any client
    // reading this snapshot later (possibly minutes from now, up until the
    // TTL expires) can tell exactly how old the snapshot is, rather than
    // having to guess based on a duplicated TTL constant or the record's
    // own timestamp (which says nothing about when this cache entry was
    // generated).
    if (redis && dbData !== null) {
      try {
        await redis.set(cacheKey, jsonString, { ex: 300 });
        console.log(`Saved result to cache under key: ${cacheKey}`);
      } catch (err) {
        console.error("Redis write error:", err);
      }
    }

    return new Response(jsonString, {
      status: 200,
      headers: {
        ...getCorsHeaders(origin),
        "Content-Type": "application/json",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error(`Error in get-cached-data Edge Function:`, error);
    return handleError(error, getCorsHeaders(origin));
  }
});
