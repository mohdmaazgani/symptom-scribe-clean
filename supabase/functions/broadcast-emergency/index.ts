import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8080",
  "https://symptom-scribe.vercel.app",
];

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin":
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : "null",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
});

function hexToUint8Array(hex: string): Uint8Array {
  const match = hex.match(/[\da-f]{2}/gi) || [];
  return new Uint8Array(match.map((h) => parseInt(h, 16)));
}

serve(async (req) => {
  const origin = req.headers.get("origin");

  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new Response(
      JSON.stringify({ error: "Origin not allowed" }),
      {
        status: 403,
        headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" },
      }
    );
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(origin) });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header provided" }),
        { status: 401, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase Client with User's JWT
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user
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

    // Get the request body
    let body: {
      id?: string;
      sender_id?: string;
      sender_name?: string;
      latitude?: number | null;
      longitude?: number | null;
      timestamp?: string;
      contact_name?: string;
      contact_phone?: string;
      signature?: string;
      publicKeyJwk?: JsonWebKey;
    } = {};

    try {
      body = await req.json();
    } catch (_) {
      return new Response(
        JSON.stringify({ error: "Invalid or empty JSON request body" }),
        { status: 400, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const {
      id,
      sender_id,
      sender_name,
      latitude,
      longitude,
      timestamp,
      contact_name,
      contact_phone,
      signature,
      publicKeyJwk,
    } = body;

    // Validate that all cryptographic parameters and metadata are present
    if (
      !id ||
      !sender_id ||
      !sender_name ||
      !timestamp ||
      !contact_name ||
      !contact_phone ||
      !signature ||
      !publicKeyJwk
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required emergency alert metadata or cryptographic signature block" }),
        { status: 400, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    // Verify Cryptographic Signature
    try {
      const publicKey = await crypto.subtle.importKey(
        "jwk",
        publicKeyJwk,
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["verify"]
      );

      const payloadString = JSON.stringify({
        id,
        sender_id,
        sender_name,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        timestamp,
        contact_phone,
        contact_name,
      });

      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(payloadString);
      const signatureBytes = hexToUint8Array(signature);

      const isValid = await crypto.subtle.verify(
        {
          name: "ECDSA",
          hash: { name: "SHA-256" },
        },
        publicKey,
        signatureBytes,
        dataBytes
      );

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: "Cryptographic signature verification failed: unauthorized alert packet" }),
          { status: 400, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
        );
      }
    } catch (verifyErr) {
      console.error("Signature verification error:", verifyErr);
      return new Response(
        JSON.stringify({ error: "Cryptographic signature verification failed with error" }),
        { status: 400, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const rawContactPhone = bodyContactPhone || (profile ? profile.emergency_contact_phone : null);
    const rawContactName = bodyContactName || (profile ? profile.emergency_contact_name : null);
    const rawSenderName = bodySenderName || (profile ? profile.full_name : null) || "A user";

    if (!rawContactPhone) {
      return new Response(
        JSON.stringify({ error: "No emergency contact phone configured or provided" }),
        { status: 400, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    // Validate phone number format (E.164 compliance)
    const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;
    if (!PHONE_REGEX.test(rawContactPhone)) {
      console.error(`Invalid phone number: ${rawContactPhone}`);
      const isEncrypted = rawContactPhone.startsWith("enc:str:");
      return new Response(
        JSON.stringify({
          error: isEncrypted
            ? "The emergency contact phone number is encrypted client-side and cannot be read by the server. Please ensure it is decrypted before triggering."
            : "Invalid emergency contact phone number format. Phone numbers must be in international format (e.g. +1234567890)."
        }),
        { status: 400, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const contactPhone = rawContactPhone;
    const contactName = (rawContactName && !rawContactName.startsWith("enc:str:")) ? rawContactName : "Emergency Contact";
    const senderName = (rawSenderName && !rawSenderName.startsWith("enc:str:")) ? rawSenderName : "A user";

    // Check Twilio Secrets
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !twilioPhone) {
      console.error("Missing Twilio credentials configuration");
      return new Response(
        JSON.stringify({ error: "Twilio credentials are not configured on the server" }),
        { status: 500, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    // Construct the SMS content
    let messageBody = `EMERGENCY ALERT from ${senderName}: I need assistance.`;
    if (latitude !== undefined && longitude !== undefined) {
      messageBody += ` My current location is: https://www.google.com/maps?q=${latitude},${longitude}`;
    } else {
      messageBody += ` (Location details were unavailable)`;
    }

    // Send via Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    // Twilio expects application/x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append("From", twilioPhone);
    formData.append("To", contactPhone);
    formData.append("Body", messageBody);

    const basicAuth = btoa(`${accountSid}:${authToken}`);

    console.log(`Sending emergency SMS to ${contactPhone}...`);
    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: formData.toString(),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio SMS failed:", twilioResult);
      return new Response(
        JSON.stringify({ error: `Twilio failed to send message: ${twilioResult.message || "Unknown error"}` }),
        { status: 502, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    console.log("Emergency SMS sent successfully via Twilio!");
    return new Response(
      JSON.stringify({
        success: true,
        message: `Emergency alert successfully broadcast to ${contactName || "emergency contact"}.`,
        sid: twilioResult.sid,
      }),
      { status: 200, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Broadcast emergency error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal server error",
      }),
      { status: 500, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
    );
  }
});
