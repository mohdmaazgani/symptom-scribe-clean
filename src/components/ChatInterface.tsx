import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Sparkles } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showInfo, showLoading } from "@/lib/toast-helpers";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_ASSISTANT_MESSAGE =
  "Hello! I'm your AI health assistant. Please describe your symptoms, and I'll help you understand possible causes and recommend self-care steps.\n\nNote: I provide general information only. For medical diagnosis or treatment, always consult a healthcare professional.";

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI health assistant. Please describe your symptoms, and I'll help you understand possible causes and recommend self-care steps.\n\n⚠️ Remember: I provide general information only. For medical diagnosis or treatment, always consult a healthcare professional.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMessages((prev) => [
      { role: "assistant", content: INITIAL_ASSISTANT_MESSAGE },
      ...prev.slice(1),
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";
    
    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    // Show loading toast
    const { dismiss: dismissLoading } = showLoading("Analyzing symptoms...", "AI is processing your request");

    try {
      const conversationHistory = messages.filter(
        (_, i) => i !== 0  // remove initial greeting at index 0
      );
      const recentContext = conversationHistory.slice(-6);

      const response = await fetch(
       `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/symptom-analyzer`,
      {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: [...recentContext, userMessage] }),
    }
  );

      if (!response.ok || !response.body) {
        throw new Error('Failed to start stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
      // Save to database
      if (assistantContent) {
        // Dismiss loading and show success
        dismissLoading();
        showSuccess("Analysis complete!", "Your symptoms have been analyzed");
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Parse AI response for structured data
          const possibleCauses: string[] = [];
          const recommendations: string[] = [];
          let severityLevel = "low";
          
          const lines = assistantContent.split('\n');
          let currentSection = '';
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.includes('**Possible Causes:**')) {
              currentSection = 'causes';
            } else if (trimmedLine.includes('**Severity Level:**')) {
              currentSection = 'severity';
              const severityMatch = trimmedLine.match(/\*\*Severity Level:\*\*\s*\[?(Low|Moderate|High)\]?/i);
              if (severityMatch) {
                severityLevel = severityMatch[1].toLowerCase();
                // Show severity info toast
                showInfo("Severity Assessment", `AI rates this as ${severityLevel} severity`);
              }
            } else if (trimmedLine.includes('**Self-Care Recommendations:**')) {
              currentSection = 'recommendations';
            } else if (trimmedLine.startsWith('- ')) {
              const item = trimmedLine.substring(2).trim();
              if (currentSection === 'causes') {
                possibleCauses.push(item);
              } else if (currentSection === 'recommendations') {
                recommendations.push(item);
              }
            }
          }

          const riskScore = severityLevel === 'high' ? Math.floor(Math.random() * 20) + 70 
            : severityLevel === 'moderate' ? Math.floor(Math.random() * 30) + 40 
            : Math.floor(Math.random() * 30) + 10;

          const { error: insertError } = await supabase.from("symptom_history").insert({
            user_id: user.id,
            symptoms: userMessage.content,
            ai_analysis: assistantContent,
            severity_level: severityLevel,
            possible_causes: possibleCauses.length > 0 ? possibleCauses : null,
            recommendations: recommendations.length > 0 ? recommendations : null,
            risk_score: riskScore,
          });

          if (insertError) {
            console.error("Error saving symptom history:", insertError);
            showError("Save failed", "Could not save to your health history");
          } else {
            showSuccess("Saved to history", "This analysis has been added to your health records");
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      dismissLoading();
      showError("Analysis failed", "Failed to get AI response. Please try again.");
      setMessages((prev) => prev.filter((m) => m !== userMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col">
      <div className="max-h-[42vh] min-h-[240px] space-y-4 overflow-y-auto bg-gradient-to-b from-background/40 to-card p-4 sm:max-h-[46vh] sm:min-h-[280px] sm:p-6 lg:max-h-[520px]">
        {messages.map((message, index) => (
          <ChatMessage key={index} role={message.role} content={message.content} />
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center animate-pulse">
              <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
            </div>
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-card border border-border">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border bg-card/95 p-3 backdrop-blur sm:p-4">
        <div className="rounded-2xl border border-border bg-background p-2 shadow-soft transition-all duration-300 focus-within:border-primary/40 focus-within:shadow-glow">
          <div className="flex items-start gap-2">
            <div className="hidden h-12 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
              <Sparkles className="h-5 w-5" />
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Describe your symptoms, timing, severity, medicines, and anything that changed..."
              className="max-h-[120px] min-h-12 resize-none border-0 bg-transparent px-2 py-3 shadow-none focus-visible:ring-0"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-12 w-12 flex-shrink-0 rounded-xl shadow-soft"
              aria-label="Send symptoms"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-2 pb-1 pt-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-1">Enter to send</span>
            <span className="rounded-full bg-muted px-2 py-1">Shift + Enter for a new line</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
