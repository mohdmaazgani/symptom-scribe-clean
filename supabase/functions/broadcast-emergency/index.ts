import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the request body (latitude, longitude, sender_name, contact_phone, contact_name)
    let body: {
      latitude?: number;
      longitude?: number;
      sender_name?: string;
      contact_phone?: string;
      contact_name?: string;
    } = {};
    try {
      body = await req.json();
    } catch (_) {
      // Body can be empty
    }

    const {
      latitude,
      longitude,
      sender_name: bodySenderName,
      contact_phone: bodyContactPhone,
      contact_name: bodyContactName,
    } = body;

    // Fetch user's profile to get their name and emergency contact details if not provided
    let profile = null;
    if (!bodySenderName || !bodyContactPhone || !bodyContactName) {
      const { data, error: profileError } = await supabaseClient
        .from("profiles")
        .select("full_name, emergency_contact_name, emergency_contact_phone")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else {
        profile = data;
      }
    }

    const contactPhone = bodyContactPhone || (profile ? profile.emergency_contact_phone : null);
    const contactName = bodyContactName || (profile ? profile.emergency_contact_name : null);
    const senderName = bodySenderName || (profile ? profile.full_name : null) || "A user";

    if (!contactPhone) {
      return new Response(
        JSON.stringify({ error: "No emergency contact phone configured or provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check Twilio Secrets
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !twilioPhone) {
      console.error("Missing Twilio credentials configuration");
      return new Response(
        JSON.stringify({ error: "Twilio credentials are not configured on the server" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Emergency SMS sent successfully via Twilio!");
    return new Response(
      JSON.stringify({
        success: true,
        message: `Emergency alert successfully broadcast to ${contactName || "emergency contact"}.`,
        sid: twilioResult.sid,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Broadcast emergency error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal server error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
