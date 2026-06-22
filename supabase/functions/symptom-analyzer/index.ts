import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { RequestSchema } from "./validation.ts";
import { detectEmergencySymptoms } from "./medicalSafety.ts";
import { rateLimit } from "../_shared/rateLimit.ts";
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

  if (origin) {
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return jsonResponse(
        { error: "Origin not allowed" },
        403,
        getCorsHeaders(origin)
      );
    }
  } else {
    // Non-browser client request (missing Origin header). Require a valid verified token.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse(
        { error: "Authentication required for non-browser requests" },
        401,
        getCorsHeaders(null)
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return jsonResponse(
        { error: "Invalid or expired authorization token" },
        401,
        getCorsHeaders(null)
      );
    }
  }
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: getCorsHeaders(origin),
    });
  }

  // Enforce JWT validation for ALL non-preflight requests to prevent token budget exhaustion
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse(
      { error: "Missing authorization header" },
      401,
      getCorsHeaders(origin)
    );
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

  if (userError || !user) {
    return jsonResponse(
      { error: "Unauthorized access: Invalid or expired token" },
      401,
      getCorsHeaders(origin)
    );
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
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    let apiEndpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
    let apiKey = LOVABLE_API_KEY;
    let model = "google/gemini-2.5-flash";

    if (GEMINI_API_KEY) {
      apiEndpoint = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      apiKey = GEMINI_API_KEY;
      model = "gemini-2.5-flash";
    } else if (OPENAI_API_KEY) {
      apiEndpoint = "https://api.openai.com/v1/chat/completions";
      apiKey = OPENAI_API_KEY;
      model = "gpt-4o-mini";
    }

    if (!apiKey) {
      return jsonResponse(
        {
          error: "API key is not configured. Please set LOVABLE_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY.",
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
      apiEndpoint,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
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