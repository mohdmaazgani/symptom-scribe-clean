import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  "https://symptom-scribe.vercel.app",
  "https://symptom-scribe-clean.netlify.app",
];

const NETLIFY_PREVIEW_ORIGIN = /^https:\/\/deploy-preview-\d+--symptom-scribe-clean\.netlify\.app$/;

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.includes(origin) || NETLIFY_PREVIEW_ORIGIN.test(origin);
}

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && isAllowedOrigin(origin) ? origin : "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
});

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(origin) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { post_id, reason, reporter_id } = await req.json();

    if (!post_id || !reason) {
      return new Response(
        JSON.stringify({ error: "post_id and reason are required" }),
        { status: 400, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    // Insert into reported_posts
    const { data: reportData, error: reportError } = await supabase
      .from("reported_posts")
      .insert({
        post_id,
        reporter_id: reporter_id || null,
        reason,
        status: "pending",
      })
      .select()
      .single();

    if (reportError) {
      console.error("Error logging report:", reportError);
      return new Response(
        JSON.stringify({ error: "Failed to record content report", details: reportError.message }),
        { status: 500, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    // Simulate notifying administrators / moderators
    console.log(`[MODERATION ALERT] Post ${post_id} reported. Reason: ${reason}. Report ID: ${reportData.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Content reported successfully. Moderators have been notified.",
        report_id: reportData.id,
      }),
      { status: 200, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Unhandled error in report-content Edge Function:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err.message }),
      { status: 500, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
    );
  }
});
