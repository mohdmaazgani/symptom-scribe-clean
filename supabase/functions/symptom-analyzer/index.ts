// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { RequestSchema } from "./validation.ts";
import { detectEmergencySymptoms } from "./medicalSafety.ts";
import { rateLimit } from "./rateLimit.ts";
import { jsonResponse } from "./utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    const rateLimitResult = await rateLimit(ip);

    if (!rateLimitResult.success) {
      return jsonResponse(
        {
          error: "Rate limit exceeded. Please try again later.",
        },
        429,
        corsHeaders
      );
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        {
          error: "Invalid JSON body",
        },
        400,
        corsHeaders
      );
    }

    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return jsonResponse(
        {
          error: "Invalid request payload",
          details: parsed.error.flatten(),
        },
        400,
        corsHeaders
      );
    }

    const { messages } = parsed.data;

    const safetyCheck = detectEmergencySymptoms(messages);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return jsonResponse(
        {
          error: "LOVABLE_API_KEY is not configured",
        },
        500,
        corsHeaders
      );
    }

    const systemPrompt = `
You are a professional medical assistant helping users understand their symptoms.

Respond ONLY with valid JSON matching this schema:

{
  "summary": "string",
  "possible_causes": ["string"],
  "recommendations": ["string"],
  "severity": "Low | Moderate | High"
}

Do not return markdown.
Do not wrap JSON in code blocks.

${safetyCheck.isEmergency
        ? `
IMPORTANT:
The user's symptoms may indicate a medical emergency.
Strongly encourage immediate professional medical attention.
`
        : ""
      }

⚠️ Important: This is general health information only. Consult a qualified healthcare provider for diagnosis and treatment.
`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "AI gateway error:",
        response.status,
        errorText
      );

      return jsonResponse(
        {
          error: "AI service error",
          status: response.status,
        },
        response.status,
        corsHeaders
      );
    }

    if (!response.body) {
      return jsonResponse(
        {
          error: "Empty AI response body",
        },
        500,
        corsHeaders
      );
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
      },
    });
  } catch (error) {
    console.error("Error in symptom-analyzer:", error);

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      500,
      corsHeaders
    );
  }
});