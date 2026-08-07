import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { RequestSchema } from "./validation.ts";
import { detectEmergencySymptoms } from "./medicalSafety.ts";
import { rateLimit } from "../_shared/rateLimit.ts";
import { jsonResponse } from "./utils.ts";
import { evaluateTriageState } from "./triageEngine.ts";


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

    const requestData = parsed.data;
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

    if ("mode" in requestData && requestData.mode === "predict") {
      const { symptoms } = requestData;

      if (!symptoms || symptoms.length === 0) {
        return jsonResponse(
          { predictions: [] },
          200,
          getCorsHeaders(origin)
        );
      }

      const predictPrompt = `
You are an expert AI medical assistant specializing in preventive health and risk analysis.
You are given a list of recent symptom logs recorded by a user.
Analyze these symptoms for recurring patterns, frequency, severity levels, and potential underlying risks.
Based on your analysis, output potential health risk predictions.

You MUST respond with a JSON object that adheres strictly to the following schema:
{
  "predictions": [
    {
      "risk": "Name of the predicted health risk (e.g., Rising Stress Markers, Seasonal Allergy Susceptibility)",
      "confidence": "Low | Medium | High",
      "advice": "Actionable, concrete preventive self-care advice (e.g., stay hydrated, track pollen count, schedule resting period)",
      "rationale": "Brief explanation of why this risk was predicted based on the symptom patterns"
    }
  ]
}

Ensure you return ONLY valid JSON. If no risks are detected or the logs are too sparse, return an empty array for the "predictions" property.

User Symptom Logs:
${symptoms.map((s, idx) => `${idx + 1}. ${s}`).join("\n")}
`;

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
                    text: predictPrompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2048,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text().catch(() => "");
        console.error("Gemini prediction API error:", geminiResponse.status, errorText);
        return jsonResponse(
          { error: "Failed to generate risk predictions from Gemini API" },
          geminiResponse.status,
          getCorsHeaders(origin)
        );
      }

      const resJson = await geminiResponse.json();
      const textContent = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;

      try {
        const parsedPrediction = JSON.parse(textContent);
        return jsonResponse(parsedPrediction, 200, getCorsHeaders(origin));
      } catch (parseErr) {
        console.error("Failed to parse Gemini prediction JSON:", parseErr, textContent);
        return jsonResponse(
          { error: "Invalid prediction JSON format returned by AI" },
          500,
          getCorsHeaders(origin)
        );
      }
    }

    const messages = "messages" in requestData ? requestData.messages : [];
    if (messages.length === 0) {
      return jsonResponse(
        { error: "At least one message is required for chat mode" },
        400,
        getCorsHeaders(origin)
      );
    }

    const safetyCheck = detectEmergencySymptoms(messages);

    // Hard-coded, non-LLM emergency response logic
    if (safetyCheck.isEmergency) {
      const encoder = new TextEncoder();
      const emergencyResponse = `### Severity Level
Severity Level: High

### Possible Causes
- Emergency condition (identified by warning keywords)

### Recommendations
- **IMMEDIATE ACTION REQUIRED**: Your description contains symptoms that may represent a life-threatening medical emergency.
- **DO NOT WAIT**: Call your local emergency services (e.g., 911 or local emergency number) or go to the nearest emergency room immediately.
- Remain as calm as possible and notify someone nearby of your situation.

⚠️ Important: This is general health information only. Consult a qualified healthcare provider for diagnosis and treatment.`;

      const stream = new ReadableStream({
        start(controller) {
          // Stream the predefined emergency message
          const words = emergencyResponse.split(" ");
          let i = 0;
          
          const intervalId = setInterval(() => {
            if (i < words.length) {
              const chunk = (i > 0 ? " " : "") + words[i];
              const payload = `data: ${JSON.stringify({
                choices: [{ delta: { content: chunk } }],
              })}\n\n`;
              controller.enqueue(encoder.encode(payload));
              i++;
            } else {
              clearInterval(intervalId);
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            }
          }, 20); // Simulate smooth streaming
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
    }

    let phase = "phase" in requestData ? requestData.phase : "gathering";
    let collectedInfo = "collectedInfo" in requestData ? requestData.collectedInfo : {};
    let questionsAsked = "questionsAsked" in requestData ? requestData.questionsAsked : 0;
    let parseFailures = "parseFailures" in requestData ? requestData.parseFailures : 0;

    // Force transition to 'ready' if questionsAsked hits 4
    if (phase === "gathering" && questionsAsked >= 4) {
      phase = "ready";
    }

    const conversationText = messages.map((m) => `${m.role}: ${m.content}`).join("\n");

    const getCorsHeaders = (origin: string | null) => ({
      "Access-Control-Allow-Origin": origin && isAllowedOrigin(origin) ? origin : "null",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    });

    const corsHeaders = getCorsHeaders(origin);

    async function getGeminiResponseText(
      systemPrompt: string,
      conversationText: string
    ): Promise<string> {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const json = await response.json();
      return json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    function streamStaticResponse(
      text: string,
      triageStateToSend: any
    ): Response {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const payload = `data: ${JSON.stringify({
            choices: [{ delta: { content: text } }],
          })}\n\n`;
          controller.enqueue(encoder.encode(payload));

          const statePayload = `data: ${JSON.stringify({
            triageState: triageStateToSend,
          })}\n\n`;
          controller.enqueue(encoder.encode(statePayload));

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    async function streamGeminiResponse(
      systemPrompt: string,
      conversationText: string,
      triageStateToSend: any
    ): Promise<Response> {
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
        return jsonResponse(
          { error: "Gemini API error during analysis streaming" },
          geminiResponse.status,
          corsHeaders
        );
      }

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const reader = geminiResponse.body.getReader();

      const stream = new ReadableStream({
        async start(controller) {
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
              const candidate = parsed?.candidates?.[0];
              const parts = candidate?.content?.parts ?? [];
              for (const part of parts) {
                if (part?.text) {
                  const payload = `data: ${JSON.stringify({
                    choices: [{ delta: { content: part.text } }],
                  })}\n\n`;
                  controller.enqueue(encoder.encode(payload));
                }
              }
            } catch (parseErr) {
              console.error("Failed to parse Gemini SSE chunk:", parseErr, jsonStr);
            }
          };

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";

              for (const line of lines) processLine(line);
            }

            buffer += decoder.decode();
            if (buffer.trim()) processLine(buffer);

            // Send the updated triageState before the DONE marker
            const statePayload = `data: ${JSON.stringify({
              triageState: triageStateToSend,
            })}\n\n`;
            controller.enqueue(encoder.encode(statePayload));
            
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
            reader.cancel(reason);
          } catch {}
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    let result;

    if (phase === "gathering") {
      const triagePrompt = `
You are an AI medical triage assistant. Your goal is to gather symptom information from the user before rendering a final health analysis.
You MUST follow these rules:
1. Ask exactly ONE clarifying question at a time.
2. Ask in the following priority order, check if each is already known from context:
   - Duration (e.g., "How long has this been occurring?")
   - Severity (e.g., "On a scale of 1-10, how severe is the pain/symptom?")
   - Associated symptoms or triggers (e.g., "Are you experiencing any other symptoms, or does anything specific seem to trigger it?")
3. NEVER provide possible causes, recommendations, severity levels, or advice yet.
4. Keep your tone empathetic, clear, and professional.
5. Once you have gathered sufficient information on these areas OR when questionsAsked reaches 4 (current questionsAsked count: ${questionsAsked}), you MUST conclude your reply by appending the exact token "READY_FOR_ANALYSIS" followed by a JSON summary of the collected info.

Format for concluding when ready (ensure JSON is valid and on a new line after the READY_FOR_ANALYSIS token):
READY_FOR_ANALYSIS
{
  "symptom": "[symptom name]",
  "duration": "[duration description]",
  "severity": "[severity description]",
  "associatedSymptoms": ["list", "of", "symptoms"],
  "triggers": "[trigger description]"
}
`;

      const responseText = await getGeminiResponseText(triagePrompt, conversationText);
      result = evaluateTriageState(
        { phase, collectedInfo, questionsAsked, parseFailures },
        responseText,
        false
      );

      if (result.nextPhase === "gathering") {
        const textToSend = result.fallbackText || responseText;
        const triageStateToSend = {
          phase: "gathering",
          collectedInfo: result.nextCollectedInfo,
          questionsAsked: result.nextQuestionsAsked,
          parseFailures: result.nextParseFailures,
        };
        return streamStaticResponse(textToSend, triageStateToSend);
      }
    } else {
      result = evaluateTriageState(
        { phase, collectedInfo, questionsAsked, parseFailures },
        null,
        false
      );
    }

    // If phase is 'ready' (either originally or transitioned above)
    if (result.nextPhase === "ready" || result.shouldRunAnalysis) {
      const analysisPrompt = `
You are a professional medical assistant helping users understand their symptoms.
You are provided with structured symptom details collected during a triage phase:
- Symptom: ${result.nextCollectedInfo?.symptom || "Unknown"}
- Duration: ${result.nextCollectedInfo?.duration || "Unknown"}
- Severity: ${result.nextCollectedInfo?.severity || "Unknown"}
- Associated Symptoms: ${(result.nextCollectedInfo?.associatedSymptoms || []).join(", ") || "None"}
- Triggers: ${result.nextCollectedInfo?.triggers || "Unknown"}

Provide a clear, detailed, and helpful response in standard Markdown format. You MUST structure your response with the following sections and exact headers so the frontend can parse them properly.
Rank potential causes by relevance to the collected triage context instead of using a generic static list.

### Severity Level
Severity Level: [Low | Moderate | High] (choose the appropriate one based on symptoms and severity)

### Possible Causes
Provide a bulleted list of possible causes ranked by relevance to the details above:
- [Ranked Cause 1]
- [Ranked Cause 2]

### Recommendations
Provide self-care steps or action items:
- [Recommendation 1]
- [Recommendation 2]

⚠️ Important: This is general health information only. Consult a qualified healthcare provider for diagnosis and treatment.
`;

      const triageStateToSend = {
        phase: "complete",
        collectedInfo: result.nextCollectedInfo,
        questionsAsked: result.nextQuestionsAsked,
        parseFailures: result.nextParseFailures,
      };

      return streamGeminiResponse(analysisPrompt, conversationText, triageStateToSend);
    }

    return jsonResponse({ error: "Invalid phase state reached" }, 500, corsHeaders);
  } catch (error) {
    console.error("Error in symptom-analyzer:", error);

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      500,
      {
        "Access-Control-Allow-Origin": origin && isAllowedOrigin(origin) ? origin : "null",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      }
    );
  }
});

