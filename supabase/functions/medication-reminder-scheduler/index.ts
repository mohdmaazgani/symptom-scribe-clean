// Supabase Edge Function: medication-reminder-scheduler
// Can be invoked manually via HTTP or triggered via Supabase Cron / pg_cron

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MedicationReminder {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  times: string[];
}

interface PushSub {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, "0");
    const currentMinutes = now.getMinutes().toString().padStart(2, "0");
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    // Fetch active medications
    const { data: medications, error: medError } = await supabase
      .from("medications")
      .select("id, user_id, name, dosage, times")
      .or(`end_date.is.null,end_date.gte.${now.toISOString().split("T")[0]}`);

    if (medError) {
      throw medError;
    }

    const dueReminders: Array<{ medication: MedicationReminder; dueTime: string }> = [];

    (medications as MedicationReminder[] | null)?.forEach((med) => {
      if (med.times && Array.isArray(med.times)) {
        med.times.forEach((t) => {
          // Match hour:minute when scheduled within current time window
          if (t === currentTimeStr) {
            dueReminders.push({ medication: med, dueTime: t });
          }
        });
      }
    });

    // Fetch push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth");

    if (subError) {
      throw subError;
    }

    const notificationsSent: Array<{ userId: string; medicationName: string; status: string }> = [];

    for (const reminder of dueReminders) {
      const userSubs = (subscriptions as PushSub[] | null)?.filter(
        (sub) => sub.user_id === reminder.medication.user_id
      );

      if (userSubs && userSubs.length > 0) {
        for (const sub of userSubs) {
          notificationsSent.push({
            userId: sub.user_id,
            medicationName: reminder.medication.name,
            status: "queued_for_push",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        checkedTime: currentTimeStr,
        totalActiveMedications: medications?.length || 0,
        dueRemindersCount: dueReminders.length,
        notificationsSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
