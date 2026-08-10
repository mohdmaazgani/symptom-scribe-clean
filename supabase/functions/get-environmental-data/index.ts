import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimit } from "../_shared/rateLimit.ts";

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

const WEATHER_API = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_API = "https://air-quality-api.open-meteo.com/v1/air-quality";
const PAST_DAYS = 7;

interface DailyAqi {
  date: string;
  aqi: number | null;
}

function isValidCoordinate(lat: unknown, lon: unknown): lat is number {
  return (
    typeof lat === "number" &&
    typeof lon === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (origin && !isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
    });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  try {
    // Rate limit check (reuses the shared limiter used by other functions)
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

    // Authenticate user — this is PHI-adjacent (location), so require a valid session.
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
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    // Parse and validate payload
    const body = await req.json().catch(() => ({}));
    const { latitude, longitude } = body ?? {};

    if (!isValidCoordinate(latitude, longitude)) {
      return new Response(
        JSON.stringify({ error: "latitude and longitude must be valid numbers" }),
        {
          status: 400,
          headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
        }
      );
    }

    // Fetch current weather (temperature + barometric pressure)
    const weatherUrl = new URL(WEATHER_API);
    weatherUrl.searchParams.set("latitude", String(latitude));
    weatherUrl.searchParams.set("longitude", String(longitude));
    weatherUrl.searchParams.set("current", "temperature_2m,pressure_msl");
    weatherUrl.searchParams.set("timezone", "auto");

    // Fetch the last N days of daily max US AQI for correlation with symptom logs
    const aqiUrl = new URL(AIR_QUALITY_API);
    aqiUrl.searchParams.set("latitude", String(latitude));
    aqiUrl.searchParams.set("longitude", String(longitude));
    aqiUrl.searchParams.set("daily", "us_aqi_max");
    aqiUrl.searchParams.set("past_days", String(PAST_DAYS));
    aqiUrl.searchParams.set("forecast_days", "1");
    aqiUrl.searchParams.set("timezone", "auto");

    const [weatherRes, aqiRes] = await Promise.all([
      fetch(weatherUrl.toString()),
      fetch(aqiUrl.toString()),
    ]);

    if (!weatherRes.ok || !aqiRes.ok) {
      console.error(
        `Environmental data upstream error: weather=${weatherRes.status} aqi=${aqiRes.status}`
      );
      return new Response(
        JSON.stringify({ error: "Failed to fetch environmental data from provider" }),
        {
          status: 502,
          headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
        }
      );
    }

    const weatherJson = await weatherRes.json();
    const aqiJson = await aqiRes.json();

    const dailyAqi: DailyAqi[] = (aqiJson?.daily?.time ?? []).map(
      (date: string, index: number) => ({
        date,
        aqi: aqiJson?.daily?.us_aqi_max?.[index] ?? null,
      })
    );

    const responseBody = {
      current: {
        temperatureC: weatherJson?.current?.temperature_2m ?? null,
        pressureMsl: weatherJson?.current?.pressure_msl ?? null,
        observedAt: weatherJson?.current?.time ?? null,
      },
      dailyAqi,
      fetchedAt: new Date().toISOString(),
      source: "open-meteo.com",
    };

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("get-environmental-data error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
    });
  }
});
