import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

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

    // Get authenticated user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized user" }),
        { status: 401, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const format: "pdf" | "csv" = body.format === "csv" ? "csv" : "pdf";
    const dateRange: "7d" | "30d" | "90d" | "all" = body.date_range || "all";
    const dataTypes: string[] = body.data_types || ["profile", "symptoms", "metrics"];

    // Compute date cutoff
    let dateCutoff: Date | null = null;
    const now = new Date();
    if (dateRange === "7d") {
      dateCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "30d") {
      dateCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (dateRange === "90d") {
      dateCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    interface ProfileRecord {
      gender?: string | null;
      blood_type?: string | null;
      full_name?: string | null;
      allergies?: string[] | null;
      chronic_conditions?: string[] | null;
    }

    interface SymptomRecord {
      created_at?: string | null;
      symptoms?: string | null;
      severity_level?: string | null;
      risk_score?: number | null;
      ai_analysis?: string | null;
      resolved?: boolean | null;
    }

    interface MetricRecord {
      recorded_at?: string | null;
      created_at?: string | null;
      metric_type?: string;
      value?: unknown;
      notes?: string | null;
    }

    // Fetch User Profile
    let profileData: ProfileRecord | null = null;
    if (dataTypes.includes("profile")) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      profileData = data as ProfileRecord | null;
    }

    // Fetch Symptoms
    let symptomHistory: SymptomRecord[] = [];
    if (dataTypes.includes("symptoms")) {
      let query = supabase
        .from("symptom_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (dateCutoff) {
        query = query.gte("created_at", dateCutoff.toISOString());
      }
      const { data } = await query;
      symptomHistory = (data || []) as SymptomRecord[];
    }

    // Fetch Health Metrics
    let healthMetrics: MetricRecord[] = [];
    if (dataTypes.includes("metrics")) {
      let query = supabase
        .from("health_metrics")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false });

      if (dateCutoff) {
        query = query.gte("recorded_at", dateCutoff.toISOString());
      }
      const { data } = await query;
      healthMetrics = (data || []) as MetricRecord[];
    }

    // Generate CSV
    if (format === "csv") {
      let csvContent = "";

      // Section 1: User Summary
      csvContent += "=== SYMPTOM SCRIBE - HEALTH DATA EXPORT ===\n";
      csvContent += `Export Date,${new Date().toISOString()}\n`;
      csvContent += `User ID,${user.id}\n`;
      csvContent += `Email,${user.email || ""}\n`;
      csvContent += `Gender,${profileData?.gender || "N/A"}\n`;
      csvContent += `Blood Type,${profileData?.blood_type || "N/A"}\n\n`;

      // Section 2: Symptom History
      if (dataTypes.includes("symptoms")) {
        csvContent += "=== SYMPTOM HISTORY ===\n";
        csvContent += "Date,Symptoms,Severity,AI Analysis,Risk Score,Resolved\n";
        symptomHistory.forEach((item) => {
          const symptomsClean = `"${(item.symptoms || "").replace(/"/g, '""')}"`;
          const analysisClean = `"${(item.ai_analysis || "").replace(/"/g, '""')}"`;
          csvContent += `"${item.created_at}",${symptomsClean},"${item.severity_level}",${analysisClean},"${item.risk_score || 0}","${item.resolved ? "Yes" : "No"}"\n`;
        });
        csvContent += "\n";
      }

      // Section 3: Health Metrics
      if (dataTypes.includes("metrics")) {
        csvContent += "=== HEALTH METRICS ===\n";
        csvContent += "Recorded At,Metric Type,Value,Notes\n";
        healthMetrics.forEach((item) => {
          const valueStr = typeof item.value === "object" ? JSON.stringify(item.value) : String(item.value || "");
          const cleanValue = `"${valueStr.replace(/"/g, '""')}"`;
          const cleanNotes = `"${(item.notes || "").replace(/"/g, '""')}"`;
          csvContent += `"${item.recorded_at || item.created_at}",${item.metric_type},${cleanValue},${cleanNotes}\n`;
        });
      }

      return new Response(csvContent, {
        status: 200,
        headers: {
          ...getCorsHeaders(origin),
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="health_data_export_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // Generate PDF using pdf-lib
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = height - 50;

    // Draw Title Header
    page.drawRectangle({
      x: 0,
      y: height - 70,
      width,
      height: 70,
      color: rgb(0.06, 0.09, 0.16),
    });

    page.drawText("Symptom Scribe — Health Data Summary Report", {
      x: 40,
      y: height - 42,
      size: 16,
      font: fontBold,
      color: rgb(0.2, 0.8, 0.9),
    });

    page.drawText(`Generated on: ${new Date().toLocaleDateString()} | User ID: ${user.id.slice(0, 8)}...`, {
      x: 40,
      y: height - 58,
      size: 9,
      font: fontRegular,
      color: rgb(0.7, 0.7, 0.7),
    });

    y = height - 95;

    // Section 1: Profile Summary
    if (dataTypes.includes("profile")) {
      page.drawText("1. Patient Profile Summary", {
        x: 40,
        y,
        size: 12,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.2),
      });
      y -= 18;

      page.drawText(`Gender: ${profileData?.gender || "Not specified"}  |  Blood Type: ${profileData?.blood_type || "Not specified"}`, {
        x: 40,
        y,
        size: 10,
        font: fontRegular,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= 25;
    }

    // Section 2: Symptom History Entries
    if (dataTypes.includes("symptoms")) {
      if (y < 120) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - 50;
      }

      page.drawText("2. Chronological Symptom History", {
        x: 40,
        y,
        size: 12,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.2),
      });
      y -= 20;

      if (symptomHistory.length === 0) {
        page.drawText("No symptom logs recorded for this timeframe.", {
          x: 40,
          y,
          size: 10,
          font: fontRegular,
          color: rgb(0.5, 0.5, 0.5),
        });
        y -= 25;
      } else {
        for (const item of symptomHistory.slice(0, 15)) {
          if (y < 100) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = height - 50;
          }

          const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A";
          page.drawText(`• [${dateStr}] Severity: ${item.severity_level || "low"} | Risk Score: ${item.risk_score || 0}/100`, {
            x: 40,
            y,
            size: 10,
            font: fontBold,
            color: rgb(0.15, 0.35, 0.6),
          });
          y -= 14;

          const symptomsSnippet = (item.symptoms || "").slice(0, 90);
          page.drawText(`  Symptoms: ${symptomsSnippet}`, {
            x: 40,
            y,
            size: 9,
            font: fontRegular,
            color: rgb(0.2, 0.2, 0.2),
          });
          y -= 18;
        }
      }
    }

    // Section 3: Health Vitals & Metrics
    if (dataTypes.includes("metrics")) {
      if (y < 120) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - 50;
      }

      page.drawText("3. Vitals & Health Metrics", {
        x: 40,
        y,
        size: 12,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.2),
      });
      y -= 20;

      if (healthMetrics.length === 0) {
        page.drawText("No health metrics recorded for this timeframe.", {
          x: 40,
          y,
          size: 10,
          font: fontRegular,
          color: rgb(0.5, 0.5, 0.5),
        });
        y -= 25;
      } else {
        for (const metric of healthMetrics.slice(0, 15)) {
          if (y < 100) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = height - 50;
          }

          const dateStr = metric.recorded_at ? new Date(metric.recorded_at).toLocaleDateString() : "N/A";
          const valStr = typeof metric.value === "object" ? JSON.stringify(metric.value) : String(metric.value);

          page.drawText(`• [${dateStr}] ${metric.metric_type}: ${valStr}`, {
            x: 40,
            y,
            size: 9.5,
            font: fontRegular,
            color: rgb(0.2, 0.2, 0.2),
          });
          y -= 16;
        }
      }
    }

    // Medical Disclaimer Footer
    page.drawText("CONFIDENTIAL MEDICAL RECORD EXPORT — FOR INFORMATIONAL & HEALTHCARE PROVIDER PURPOSES ONLY", {
      x: 40,
      y: 30,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...getCorsHeaders(origin),
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="health_data_export_${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Unhandled error in export-user-data Edge Function:", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate health data export", details: err.message }),
      { status: 500, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
    );
  }
});
