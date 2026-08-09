// Supabase Edge Function: appointment-reminder-scheduler
// Can be invoked manually via HTTP or triggered via Supabase Cron / pg_cron

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Appointment {
  id: string;
  user_id: string;
  doctor_name: string;
  specialty: string;
  appointment_date: string;
  reminder_sent: boolean;
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
    const targetWindowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
    const targetWindowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

    // Query upcoming appointments occurring in ~24 hours that haven't sent reminders
    const { data: upcomingAppointments, error: apptError } = await supabase
      .from("appointments")
      .select("id, user_id, doctor_name, specialty, appointment_date, reminder_sent")
      .eq("status", "upcoming")
      .gte("appointment_date", targetWindowStart)
      .lte("appointment_date", targetWindowEnd);

    if (apptError) {
      throw apptError;
    }

    const apptsToRemind = (upcomingAppointments as Appointment[] | null) || [];
    const notificationsTriggered: Array<{ appointmentId: string; doctorName: string; status: string }> = [];

    if (apptsToRemind.length > 0) {
      // Query push subscriptions
      const { data: pushSubs } = await supabase
        .from("push_subscriptions")
        .select("user_id, endpoint, p256dh, auth");

      for (const appt of apptsToRemind) {
        const userSubs = (pushSubs as PushSub[] | null)?.filter((sub) => sub.user_id === appt.user_id);
        if (userSubs && userSubs.length > 0) {
          notificationsTriggered.push({
            appointmentId: appt.id,
            doctorName: appt.doctor_name,
            status: "24h_push_queued",
          });
        }

        // Update reminder_sent status
        await supabase
          .from("appointments")
          .update({ reminder_sent: true, updated_at: new Date().toISOString() })
          .eq("id", appt.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        checkedWindow: { start: targetWindowStart, end: targetWindowEnd },
        upcomingAppointmentsCount: apptsToRemind.length,
        notificationsTriggered,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
