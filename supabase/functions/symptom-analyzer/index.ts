// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { RequestSchema } from "./validation.ts";
import { detectEmergencySymptoms } from "./medicalSafety.ts";
import { rateLimit } from "./rateLimit.ts";
import { jsonResponse } from "./utils.ts";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8080",
  "https://symptom-scribe.vercel.app",
];

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin":
    origin && ALLOWED_ORIGINS.includes(origin)
      ? origin
      : "null",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
});

serve(async (req: Request): Promise<Response> => {
  
  const origin = req.headers.get("origin");

if (
  origin &&
  !ALLOWED_ORIGINS.includes(origin)
) {
  return new Response(
    JSON.stringify({
      error: "Origin not allowed",
    }),
    {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: getCorsHeaders(origin),
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
        getCorsHeaders(origin)
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
        getCorsHeaders(origin)
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
        getCorsHeaders(origin)
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
        getCorsHeaders(origin)
      );
    }

    const systemPrompt = `
You are a professional medical assistant helping users understand their symptoms.

Provide a clear, detailed, and helpful response in standard Markdown format. You MUST structure your response with the following sections and exact headers so the frontend can parse them properly:

### Severity Level
Severity Level: ${
      safetyCheck.isEmergency
        ? "High"
        : "[Low | Moderate | High] (choose the appropriate one based on symptoms)"
    }

### Possible Causes
Provide a bulleted list of possible causes:
- [Cause 1]
- [Cause 2]

### Recommendations
Provide self-care steps or action items:
- [Recommendation 1]
- [Recommendation 2]

${
  safetyCheck.isEmergency
    ? `
IMPORTANT:
The user's symptoms indicate a potential medical emergency.
You MUST set the Severity Level to High, and strongly advise immediate professional medical attention or visiting the nearest emergency room.
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
        getCorsHeaders(origin)
      );
    }

    if (!response.body) {
      return jsonResponse(
        {
          error: "Empty AI response body",
        },
        500,
        getCorsHeaders(origin)
      );
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        ...getCorsHeaders(origin),
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
      getCorsHeaders(origin)
    );
  }
});