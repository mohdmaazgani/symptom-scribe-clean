import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
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

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (origin && !isAllowedOrigin(origin)) {
    return new Response(
      JSON.stringify({ error: "Origin not allowed" }),
      {
        status: 403,
        headers: {
          ...getCorsHeaders(origin),
          "Content-Type": "application/json",
        },
      }
    );
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
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        {
          status: 429,
          headers: {
            ...getCorsHeaders(origin),
            "Content-Type": "application/json",
          },
        }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: {
            ...getCorsHeaders(origin),
            "Content-Type": "application/json",
          },
        }
      );
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
      return new Response(
        JSON.stringify({ error: "Invalid authorization token" }),
        {
          status: 401,
          headers: {
            ...getCorsHeaders(origin),
            "Content-Type": "application/json",
          },
        }
      );
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
      return new Response(
        JSON.stringify({ error: "Failed to delete user account" }),
        {
          status: 500,
          headers: {
            ...getCorsHeaders(origin),
            "Content-Type": "application/json",
          },
        }
      );
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
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal server error",
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
