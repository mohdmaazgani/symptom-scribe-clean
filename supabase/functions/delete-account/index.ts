import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    return new Response(null, {
      headers: getCorsHeaders(origin),
    });
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
      return handleError(new AppError(ErrorCodes.AUTH_REQUIRED, "Missing authorization header", 401), getCorsHeaders(origin));
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return handleError(new AppError(ErrorCodes.AUTH_REQUIRED, "Unauthorized", 401), getCorsHeaders(origin));
    }

    const { error } = await supabase.auth.admin.deleteUser(
      user.id
    );

    if (error) {
      return handleError(new AppError(ErrorCodes.INTERNAL_ERROR, "Failed to delete user account", 500, error), getCorsHeaders(origin));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account deleted successfully",
      }),
      {
        status: 200,
        headers: {
          ...getCorsHeaders(origin),
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return handleError(error, getCorsHeaders(origin));
  }
});
