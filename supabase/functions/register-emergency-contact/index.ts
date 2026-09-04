import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { rateLimit } from "../_shared/rateLimit.ts";
import { ecJwkThumbprint } from "../_shared/jwkThumbprint.ts";

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

const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

// Registers the caller's emergency-mesh P2P signing public key as belonging
// to their account, together with their (already client-decrypted) emergency
// contact info. broadcast-emergency looks this record up by public key
// thumbprint so it never has to trust a client-supplied contact_phone
// (issue #1154). Call this whenever the device's P2P key or emergency
// contact info is (re)established, while the device is online and
// authenticated -- an offline device relying on a peer to relay its alert
// later must already have registered during a prior online session.
serve(async (req) => {
  const origin = req.headers.get("origin");

  if (origin && !isAllowedOrigin(origin)) {
    return new Response(
      JSON.stringify({ error: "Origin not allowed" }),
      { status: 403, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
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
        { status: 429, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header provided" }),
        { status: 401, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization token" }),
        { status: 401, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    let body: {
      publicKeyJwk?: JsonWebKey;
      contact_name?: string;
      contact_phone?: string;
    } = {};

    try {
      body = await req.json();
    } catch (_) {
      return new Response(
        JSON.stringify({ error: "Invalid or empty JSON request body" }),
        { status: 400, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const { publicKeyJwk, contact_name, contact_phone } = body;

    if (!publicKeyJwk || !contact_phone) {
      return new Response(
        JSON.stringify({ error: "publicKeyJwk and contact_phone are required" }),
        { status: 400, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    if (!PHONE_REGEX.test(contact_phone)) {
      return new Response(
        JSON.stringify({
          error: "Invalid emergency contact phone number format. Phone numbers must be in international format (e.g. +1234567890).",
        }),
        { status: 400, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    let thumbprint: string;
    try {
      // Confirms the JWK is actually a usable ECDSA P-256 public key, not
      // just a plausible-looking object, before it's trusted as an identity.
      await crypto.subtle.importKey(
        "jwk",
        publicKeyJwk,
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["verify"]
      );
      thumbprint = await ecJwkThumbprint(publicKeyJwk);
    } catch (err) {
      console.error("Invalid public key supplied for registration:", err);
      return new Response(
        JSON.stringify({ error: "Invalid ECDSA P-256 public key" }),
        { status: 400, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // A signing key belongs to exactly one account. If a different user
    // already registered this exact key, refuse to reassign it rather than
    // silently letting a second account hijack an existing trusted key.
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("mesh_signing_keys")
      .select("user_id")
      .eq("public_key_thumbprint", thumbprint)
      .maybeSingle();

    if (lookupError) {
      console.error("Failed to look up existing signing key:", lookupError);
      return new Response(
        JSON.stringify({ error: "Failed to register signing key" }),
        { status: 500, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    if (existing && existing.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "This signing key is already registered to a different account" }),
        { status: 409, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const { error: upsertError } = await supabaseAdmin
      .from("mesh_signing_keys")
      .upsert(
        {
          user_id: user.id,
          public_key_thumbprint: thumbprint,
          contact_name: contact_name || null,
          contact_phone,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "public_key_thumbprint" }
      );

    if (upsertError) {
      console.error("Failed to upsert signing key registration:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to register signing key" }),
        { status: 500, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Register emergency contact error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal server error",
      }),
      { status: 500, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
    );
  }
});
