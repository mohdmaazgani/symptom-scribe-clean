import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showInfo, showLoading } from "@/lib/toast-helpers";
import { browserEnv } from "@/lib/env";
import { invalidateCache } from "@/lib/cached-queries";
import { whenKeysReady } from "@/lib/encryption";
import { encryptSymptom, db, type OfflineSymptom } from "@/lib/offline-db";
import { Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

const suggestions = [
  { emoji: "🤒", label: "I have a fever" },
  { emoji: "🤧", label: "Sore throat for 3 days" },
  { emoji: "🤕", label: "I have headache" },
  { emoji: "🤢", label: "Stomach pain after eating" },
  { emoji: "😵‍💫", label: "Feeling tired and dizzy" },
];

interface ISpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface ISpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor;
    webkitSpeechRecognition?: ISpeechRecognitionConstructor;
  }
}

const AIHealthAssistant = () => {
  const [symptoms, setSymptoms] = useState("");
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 500;
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; text: string; time: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentlyReadingText, setCurrentlyReadingText] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Cleanup recognition and speech synthesis on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleToggleSpeech = (text: string) => {
    if (currentlyReadingText === text) {
      window.speechSynthesis.cancel();
      setCurrentlyReadingText(null);
    } else {
      window.speechSynthesis.cancel();

      // Clean markdown tags and bullets for natural pronunciation
      const cleanText = text
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/[-*•]\s+/g, "")
        .replace(/\n+/g, " ");

      const utterance = new SpeechSynthesisUtterance(cleanText);

      utterance.onend = () => {
        setCurrentlyReadingText(null);
      };

      utterance.onerror = () => {
        setCurrentlyReadingText(null);
      };

      setCurrentlyReadingText(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const getTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleVoiceInput = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      showError(
        "Not supported",
        "Voice recognition is not supported in your browser. Try Chrome or Edge."
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    setIsListening(true);

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setSymptoms(transcript);
      setCharCount(transcript.length);
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      setIsListening(false);
      if (event.error !== "aborted") {
        showError("Voice error", "Could not capture voice. Please try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleAnalyze = async (text?: string) => {
    const userMessage = (text ?? symptoms).trim();
    if (!userMessage || loading) return;

    setSymptoms("");
    setCharCount(0);
    const time = getTime();
    setMessages((prev) => [...prev, { role: "user", text: userMessage, time }]);
    setLoading(true);

    let assistantContent = "";

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, text: assistantContent } : m));
        }
        return [...prev, { role: "assistant", text: assistantContent, time: getTime() }];
      });
    };

    const { dismiss: dismissLoading } = showLoading(
      "Analyzing symptoms...",
      "AI is processing your request"
    );

    try {
      const recentContext = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || browserEnv.supabasePublishableKey;

      const response = await fetch(browserEnv.getSupabaseFunctionUrl("symptom-analyzer"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [...recentContext, { role: "user", content: userMessage }],
        }),
      });

      if (!response.ok || !response.body) throw new Error("Failed to start stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (assistantContent) {
        dismissLoading();
        showSuccess("Analysis complete!", "Your symptoms have been analyzed");

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const possibleCauses: string[] = [];
          const recommendations: string[] = [];
          let severityLevel = "low";

          const lines = assistantContent.split("\n");
          let currentSection = "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (/possible\s+causes/i.test(trimmedLine)) {
              currentSection = "causes";
            } else if (/severity\s+level/i.test(trimmedLine)) {
              currentSection = "severity";
              const severityMatch = trimmedLine.match(
                /severity\s+level\s*:\s*[*_#`[]*\s*(low|moderate|high)/i
              );
              if (severityMatch) {
                severityLevel = severityMatch[1].toLowerCase();
                showInfo("Severity Assessment", `AI rates this as ${severityLevel} severity`);
              }
            } else if (/recommendations/i.test(trimmedLine)) {
              currentSection = "recommendations";
            } else {
              const listMatch =
                trimmedLine.match(/^[-*•]\s+(.+)/) || trimmedLine.match(/^\d+\.\s+(.+)/);
              if (listMatch) {
                const item = listMatch[1].trim();
                if (currentSection === "causes") possibleCauses.push(item);
                else if (currentSection === "recommendations") recommendations.push(item);
              }
            }
          }

          const riskScore =
            severityLevel === "high"
              ? Math.floor(Math.random() * 20) + 70
              : severityLevel === "moderate"
                ? Math.floor(Math.random() * 30) + 40
                : Math.floor(Math.random() * 30) + 10;

          const recordId = crypto.randomUUID();
          const record = {
            id: recordId,
            user_id: user.id,
            symptoms: userMessage,
            ai_analysis: assistantContent,
            severity_level: severityLevel,
            possible_causes: possibleCauses.length > 0 ? possibleCauses : null,
            recommendations: recommendations.length > 0 ? recommendations : null,
            risk_score: riskScore,
            resolved: false,
            created_at: new Date().toISOString(),
          };

          const keys = await whenKeysReady();
          const encryptedRecord = await encryptSymptom(record as unknown as OfflineSymptom, keys.encryptionKey, keys.searchKey);

          const { error: insertError } = await supabase.from("symptom_history").insert(encryptedRecord);

          if (insertError) {
            console.error("Error saving symptom history:", insertError);
            showError("Save failed", "Could not save to your health history");
          } else {
            await invalidateCache("symptom_history");
            
            // Save locally to Dexie immediately
            await db.symptomHistory.put({
              ...encryptedRecord,
              pending_sync: 0,
              pending_update: 0,
              pending_delete: 0,
            } as unknown as OfflineSymptom);

            showSuccess("Saved to history", "This analysis has been added to your health records");
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      dismissLoading();
      showError("Analysis failed", "Failed to get AI response. Please try again.");
      setMessages((prev) => prev.filter((m) => !(m.role === "user" && m.text === userMessage)));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const hasMessages = messages.length > 0 || loading;

  return (
    <div className="flex flex-col h-full w-full max-w-full bg-background text-foreground overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 w-full px-3 sm:px-5 py-3 border-b border-border flex items-center justify-end gap-3">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground font-medium">Online</span>
        </div>
      </div>

      {/* Chat area — must have min-w-0 so it can shrink inside the flex column */}
      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        {!hasMessages ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center h-full px-4 sm:px-6 pb-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-3 w-full min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-2xl sm:text-3xl shadow-lg flex-shrink-0">
                🤖
              </div>
              <div className="w-full min-w-0 px-2">
                <h2 className="text-base sm:text-lg font-semibold break-words">
                  Hello! I'm your AI Health Assistant 👋
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto break-words">
                  I can help you understand your symptoms and provide health insights.{" "}
                  <span className="text-teal-500 font-medium">How can I assist you today?</span>
                </p>
              </div>
            </div>

            {/* Suggestion chips — the tricky part */}
            {/*
              The chip row uses overflow-x-auto so chips scroll horizontally on mobile.
              For that to clip (not overflow the page) every ancestor up to the scroll
              root needs either overflow-hidden or min-w-0. We give the wrapper
              overflow-hidden and use negative-margin bleed (-mx-4/px-4) so the
              scrollable track visually reaches the edges without triggering page overflow.
            */}
            <div className="w-full max-w-lg min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground px-2 flex-shrink-0">Try asking</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="overflow-hidden">
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {suggestions.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => handleAnalyze(s.label)}
                      className="flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border border-border bg-muted/50 hover:bg-muted hover:border-teal-500/50 transition-all text-center min-w-[88px]"
                    >
                      <span className="text-xl">{s.emoji}</span>
                      <span className="text-xs text-muted-foreground leading-tight">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Messages ── */
          /*
            Only one max-w here — max-w-2xl. Putting both max-w-2xl and max-w-full
            on the same element is a no-op (the smaller wins) and signals confusion.
            The important additions are min-w-0 so this div can shrink, and
            overflow-hidden so no child can leak out horizontally.
          */
          <div className="max-w-2xl mx-auto w-full min-w-0 overflow-hidden px-3 sm:px-4 py-5 space-y-5">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 sm:gap-3 min-w-0 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-sm flex-shrink-0 mt-0.5 shadow-sm">
                    🤖
                  </div>
                )}
                {/* min-w-0 here is essential — without it max-w-[85%] has nothing to be 85% *of* */}
                <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[78%] min-w-0 relative group">
                  <div
                    className={`rounded-2xl px-3.5 sm:px-4 py-3 text-sm leading-relaxed relative break-words [overflow-wrap:anywhere] ${
                      msg.role === "user"
                        ? "bg-teal-500 text-white rounded-br-sm ml-auto"
                        : `bg-muted text-foreground rounded-bl-sm border border-border transition-all duration-300 ${
                            currentlyReadingText === msg.text
                              ? "ring-2 ring-teal-500/30 bg-teal-500/5"
                              : ""
                          }`
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => handleToggleSpeech(msg.text)}
                        className="absolute right-2 top-2 p-1.5 rounded-lg text-muted-foreground hover:text-teal-500 hover:bg-teal-500/10 transition-colors"
                        title={currentlyReadingText === msg.text ? "Stop reading" : "Read aloud"}
                      >
                        {currentlyReadingText === msg.text ? (
                          <VolumeX className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <div className={msg.role === "assistant" ? "pr-6" : ""}>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: (() => {
                            const lines = msg.text.split("\n");
                            let html = "";
                            let inList = false;
                            for (const line of lines) {
                              const listMatch = line.trim().match(/^[-*•]\s+(.+)/);
                              if (listMatch) {
                                if (!inList) {
                                  html +=
                                    "<ul style='padding-left:16px;margin:6px 0;list-style:disc;overflow-wrap:anywhere'>";
                                  inList = true;
                                }
                                html += `<li style='margin:2px 0;overflow-wrap:anywhere'>${listMatch[1].replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</li>`;
                              } else {
                                if (inList) {
                                  html += "</ul>";
                                  inList = false;
                                }
                                if (line.trim() === "") {
                                  html += "<br>";
                                } else {
                                  html += `<p style='margin:2px 0;overflow-wrap:anywhere'>${line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</p>`;
                                }
                              }
                            }
                            if (inList) html += "</ul>";
                            return html;
                          })(),
                        }}
                      />
                    </div>
                  </div>
                  <span
                    className={`text-[10px] text-muted-foreground px-1 ${msg.role === "user" ? "text-right" : "text-left"}`}
                  >
                    {msg.time} {msg.role === "user" && "✓"}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-sm flex-shrink-0 shadow-sm">
                  🤖
                </div>
                <div className="bg-muted border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input — pinned at bottom */}
      <div className="flex-shrink-0 w-full border-t border-border px-3 sm:px-4 py-3 bg-background">
        <div className="max-w-2xl mx-auto w-full min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-muted border border-border rounded-2xl px-3 sm:px-4 py-2.5 focus-within:border-teal-500/50 focus-within:ring-1 focus-within:ring-teal-500/20 transition-all min-h-[48px]">
            {/* Voice button */}
            <button
              onClick={handleVoiceInput}
              disabled={loading}
              title={isListening ? "Stop listening" : "Speak your symptoms"}
              className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                isListening
                  ? "bg-red-500/20 text-red-500 animate-pulse"
                  : "text-muted-foreground hover:text-teal-500 hover:bg-teal-500/10"
              } disabled:opacity-30 disabled:cursor-not-allowed`}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
              </svg>
            </button>

            {isListening && (
              <div className="flex items-center gap-0.5 px-1 h-5 flex-shrink-0">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <motion.div
                    key={bar}
                    className="w-0.5 bg-red-500 rounded-full"
                    animate={{
                      height: ["25%", "100%", "25%"],
                    }}
                    transition={{
                      duration: 0.5 + bar * 0.1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={symptoms}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= MAX_CHARS) {
                  setSymptoms(value);
                  setCharCount(value.length);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening…" : "Describe your symptoms…"}
              rows={1}
              className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none max-h-28 leading-relaxed self-center"
            />

            <button
              onClick={() => handleAnalyze()}
              disabled={loading || !symptoms.trim() || charCount >= MAX_CHARS}
              className="w-8 h-8 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all flex-shrink-0 hover:scale-105 active:scale-95"
              aria-label="Send"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3.5 h-3.5 text-white"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-1.5 px-2 break-words">
            {isListening
              ? "🔴 Listening… click the mic to stop"
              : "AI-generated guidance — always consult a doctor for medical advice"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIHealthAssistant;