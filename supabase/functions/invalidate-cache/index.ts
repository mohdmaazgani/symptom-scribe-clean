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
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
});

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (origin && !isAllowedOrigin(origin)) {
    return handleError(new AppError(ErrorCodes.VALIDATION_ERROR, "Origin not allowed", 403), getCorsHeaders(origin));
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

    let userId: string | null = null;
    let table: string | null = null;

    const webhookSecretHeader = req.headers.get("x-webhook-secret");
    const configuredWebhookSecret = Deno.env.get("WEBHOOK_SECRET");

    if (webhookSecretHeader && configuredWebhookSecret && webhookSecretHeader === configuredWebhookSecret) {
      // Authenticated via Webhook Secret (from database triggers)
      const payload = await req.json();
      console.log("Processing cache invalidation from database webhook:", payload);

      table = payload.table;
      const record = payload.record || payload.old_record;
      userId = record?.user_id;

      if (!userId || !table) {
        return handleError(new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid webhook payload structure", 400), getCorsHeaders(origin));
      }
    } else {
      // Fallback: Authenticate via client session token
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

      userId = user.id;
      const body = await req.json();
      table = body.table;
    }

    const allowedTables = ["profiles", "symptom_history", "health_metrics", "chat_sessions"];
    if (!table || !allowedTables.includes(table)) {
      return handleError(new AppError(ErrorCodes.VALIDATION_ERROR, `Invalid table name: ${table}`, 400), getCorsHeaders(origin));
    }

    const cacheKey = `cache:${userId}:${table}`;

    if (redis) {
      try {
        await redis.del(cacheKey);
        console.log(`Successfully invalidated cache for key: ${cacheKey}`);
      } catch (err) {
        console.error(`Failed to delete cache key ${cacheKey} from Redis:`, err);
        throw err;
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: `Cache invalidated for key: ${cacheKey}` }),
      {
        status: 200,
        headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(`Error in invalidate-cache Edge Function:`, error);
    return handleError(error, getCorsHeaders(origin));
  }
});
