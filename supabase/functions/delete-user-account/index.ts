import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
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
    return handleError(new AppError(ErrorCodes.VALIDATION_ERROR, "Origin not allowed", 403), getCorsHeaders(origin));
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(origin) });
  }

  try {
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    const rateLimitResult = await rateLimit(ip);
    if (!rateLimitResult.success) {
      return handleError(new AppError(ErrorCodes.RATE_LIMIT_EXCEEDED, "Rate limit exceeded. Please try again later.", 429), getCorsHeaders(origin));
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return handleError(new AppError(ErrorCodes.AUTH_REQUIRED, "No authorization header", 401), getCorsHeaders(origin));
    }

    // 1. Get user details from the client-provided token to identify who is making the request
    const token = authHeader.replace("Bearer ", "");
    const client = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // NOTE: passing the Authorization header into `global.headers` only
    // affects this client's outgoing REST calls — it does not populate a
    // session for auth.getUser() to read. The token must be passed
    // explicitly, or this always fails with "Auth session missing" even for
    // a valid JWT, matching the pattern already used in delete-account.
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser(token);

    if (userError || !user) {
      return handleError(new AppError(ErrorCodes.AUTH_REQUIRED, "Invalid authorization token", 401), getCorsHeaders(origin));
    }

    // 2. Initialize the admin client with the service role key to delete the user
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return handleError(new AppError(ErrorCodes.INTERNAL_ERROR, "Failed to delete user account", 500, deleteError), getCorsHeaders(origin));
    }

    return new Response(
      JSON.stringify({ message: "Account successfully deleted" }),
      {
        status: 200,
        headers: {
          ...getCorsHeaders(origin),
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("Delete user error:", err);
    return handleError(err, getCorsHeaders(origin));
  }
});
