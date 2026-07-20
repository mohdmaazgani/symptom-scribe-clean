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
  "https://symptom-scribe-clean.netlify.app",
];

const NETLIFY_PREVIEW_ORIGIN = /^https:\/\/deploy-preview-\d+--symptom-scribe-clean\.netlify\.app$/;

function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.includes(origin) || NETLIFY_PREVIEW_ORIGIN.test(origin);
}

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && isAllowedOrigin(origin) ? origin : "null",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
});

serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");

  // 1. Origin allowlist check
  if (origin && !isAllowedOrigin(origin)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, getCorsHeaders(origin));
  }

  // 2. CORS preflight — must come before any auth logic
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: getCorsHeaders(origin),
    });
  }

  // 3. Enforce JWT for all non-OPTIONS requests
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing authorization header" }, 401, getCorsHeaders(origin));
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser(token);

  if (userError || !user) {
    return jsonResponse(
      { error: "Unauthorized access: Invalid or expired token" },
      401,
      getCorsHeaders(origin)
    );
  }

  try {
    const ip =
      req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";

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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      return jsonResponse(
        {
          error: "GEMINI_API_KEY is not configured",
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

    const conversationText = messages.map((m) => `${m.role}: ${m.content}`).join("\n");

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nConversation:\n${conversationText}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiResponse.ok || !geminiResponse.body) {
      const errorText = await geminiResponse.text().catch(() => "");

      console.error("Gemini API error:", geminiResponse.status, errorText);

      return jsonResponse(
        {
          error: "Gemini API error",
          status: geminiResponse.status,
        },
        geminiResponse.status,
        getCorsHeaders(origin)
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    function extractTextChunks(parsed: unknown): string[] {
      const candidate = (parsed as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
        ?.candidates?.[0];
      const parts = candidate?.content?.parts ?? [];
      return parts.map((p) => p?.text).filter((t): t is string => Boolean(t));
    }

    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        const localReader = geminiResponse.body!.getReader();
        reader = localReader;
        let buffer = "";
        let closed = false;

        const safeClose = () => {
          if (closed) return;
          closed = true;
          controller.close();
        };

        const processLine = (line: string) => {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) return;

          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr || jsonStr === "[DONE]") return;

          try {
            const parsed = JSON.parse(jsonStr);
            for (const chunkText of extractTextChunks(parsed)) {
              const payload = `data: ${JSON.stringify({
                choices: [{ delta: { content: chunkText } }],
              })}\n\n`;
              controller.enqueue(encoder.encode(payload));
            }
          } catch (parseErr) {
            console.error("Failed to parse Gemini SSE chunk:", parseErr, jsonStr);
          }
        };

        try {
          while (true) {
            const { done, value } = await localReader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) processLine(line);
          }

          buffer += decoder.decode(); // flush any pending multi-byte sequence
          if (buffer.trim()) processLine(buffer);

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (streamErr) {
          console.error("Error while relaying Gemini stream:", streamErr);
          const errorPayload = `data: ${JSON.stringify({
            error: "Stream interrupted while generating the response.",
          })}\n\n`;
          controller.enqueue(encoder.encode(errorPayload));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally {
          safeClose();
        }
      },
      cancel(reason) {
        try {
          reader?.cancel(reason);
        } catch {
          // reader may already be closed/released — safe to ignore.
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...getCorsHeaders(origin),
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in symptom-analyzer:", error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      500,
      getCorsHeaders(origin)
    );
  }
});
