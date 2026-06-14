import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { redis } from "../_shared/redis.ts";
import { rateLimit } from "../_shared/rateLimit.ts";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8080",
  "https://symptom-scribe.vercel.app",
];

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin":
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
});

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
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
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        {
          status: 429,
          headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
        }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
        }
      );
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
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
        }
      );
    }

    // Parse payload
    const body = await req.json();
    const { table } = body;
    const allowedTables = ["profiles", "symptom_history", "health_metrics", "chat_sessions"];

    if (!table || !allowedTables.includes(table)) {
      return new Response(
        JSON.stringify({ error: `Invalid or unsupported table. Must be one of: ${allowedTables.join(", ")}` }),
        {
          status: 400,
          headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
        }
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

    const jsonString = JSON.stringify(dbData);

    // Save to Redis Cache (TTL = 300 seconds)
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
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...getCorsHeaders(origin),
          "Content-Type": "application/json",
        },
      }
    );
  }
});
