/**
 * Example Edge Function for Admin Operations
 *
 * This demonstrates how to safely perform admin-level operations
 * that require the service role key (which should NEVER be exposed to the browser).
 *
 * Deployment:
 * 1. Copy this file to functions/ and remove the .example suffix
 * 2. Run: supabase functions deploy admin-operation
 * 3. Call from client: fetch('/functions/v1/admin-operation', { headers: { Authorization: `Bearer ${session.access_token}` } })
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Extract Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Initialize Supabase admin client with service role key
    // This key should NEVER be exposed to the browser
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Get the user from the token to verify they're authenticated
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Now you can safely perform admin operations
    // Example: Create a new record with admin privileges
    const body = await req.json();

    // Validate input
    if (!body.data) {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Perform the admin operation
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert([{ user_id: user.id, ...body.data }]);

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
