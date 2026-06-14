import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Plus, History, Trash2, Menu } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { browserEnv } from "@/lib/env";
import { showSuccess, showError, showInfo, showLoading } from "@/lib/toast-helpers";
import { invalidateCache } from "@/lib/cached-queries";
import ChatLoading from "./ChatLoading";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { type Json } from "@/integrations/supabase/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MAX_CHARS = 500;

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_GREETING: Message = {
  role: "assistant",
  content: "Hello! I'm your AI health assistant. Please describe your symptoms, and I'll help you understand possible causes and recommend self-care steps.\n\n⚠️ Remember: I provide general information only. For medical diagnosis or treatment, always consult a healthcare professional.",
};

interface ChatSession {
  id: string;
  user_id: string;
  title: string | null;
  messages: Json;
  created_at: string | null;
  updated_at: string | null;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error("Error fetching chat sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    setActiveSessionId(sessionId);
    const loadedMessages = (session.messages as unknown as Message[]) || [];
    if (loadedMessages.length === 0) {
      setMessages([INITIAL_GREETING]);
    } else {
      setMessages(loadedMessages);
    }
    setIsMobileOpen(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;

      showSuccess("Session Deleted", "Chat session was successfully removed");
      
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
      
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error("Error deleting session:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to delete chat session";
      showError("Delete Failed", errorMsg);
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([INITIAL_GREETING]);
    setIsMobileOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
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

    const { dismiss: dismissLoading } = showLoading("Analyzing symptoms...", "AI is processing your request");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to chat with the assistant.");
      }

      let currentSessionId = activeSessionId;
      if (!currentSessionId) {
        const title = userMessage.content.substring(0, 40) + (userMessage.content.length > 40 ? "..." : "");
        const { data: newSession, error: createError } = await supabase
          .from("chat_sessions")
          .insert({
            user_id: user.id,
            title,
            messages: newMessages as unknown as Json,
          })
          .select()
          .single();

        if (createError) throw createError;
        currentSessionId = newSession.id;
        setActiveSessionId(currentSessionId);
        setSessions((prev) => [newSession as unknown as ChatSession, ...prev]);
      } else {
        const { error: updateError } = await supabase
          .from("chat_sessions")
          .update({
            messages: newMessages as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentSessionId);

        if (updateError) throw updateError;
      }

      const previousHistory = messages.filter((_, i) => i !== 0);
      const recentContext = previousHistory.slice(-6);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || browserEnv.supabasePublishableKey;

      const response = await fetch(browserEnv.getSupabaseFunctionUrl("symptom-analyzer"), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: [...recentContext, userMessage] }),
      });

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

      if (assistantContent) {
        dismissLoading();
        showSuccess("Analysis complete!", "Your symptoms have been analyzed");
        
        const finalMessages = [...newMessages, { role: "assistant" as const, content: assistantContent }];

        const { error: finalUpdateError } = await supabase
          .from("chat_sessions")
          .update({
            messages: finalMessages as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentSessionId);

        if (finalUpdateError) {
          console.error("Error updating chat session messages:", finalUpdateError);
        }

        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? { ...s, messages: finalMessages as unknown as Json, updated_at: new Date().toISOString() }
              : s
          )
        );

        const possibleCauses: string[] = [];
        const recommendations: string[] = [];
        let severityLevel = "low";
        
        const lines = assistantContent.split('\n');
        let currentSection = '';
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (/possible\s+causes/i.test(trimmedLine)) {
            currentSection = 'causes';
          } else if (/severity\s+level/i.test(trimmedLine)) {
            currentSection = 'severity';
            const severityMatch = trimmedLine.match(/severity\s+level\s*:\s*[*_#`[]*\s*(low|moderate|high)/i);
            if (severityMatch) {
              severityLevel = severityMatch[1].toLowerCase();
              showInfo("Severity Assessment", `AI rates this as ${severityLevel} severity`);
            }
          } else if (/recommendations/i.test(trimmedLine)) {
            currentSection = 'recommendations';
          } else {
            const listMatch = trimmedLine.match(/^[-*•]\s+(.+)/) || trimmedLine.match(/^\d+\.\s+(.+)/);
            if (listMatch) {
              const item = listMatch[1].trim();
              if (currentSection === 'causes') {
                possibleCauses.push(item);
              } else if (currentSection === 'recommendations') {
                recommendations.push(item);
              }
            }
          }
        }

        const riskScore = severityLevel === 'high' ? Math.floor(Math.random() * 20) + 70 
          : severityLevel === 'moderate' ? Math.floor(Math.random() * 30) + 40 
          : Math.floor(Math.random() * 30) + 10;

        const isMedicalAnalysis =
          assistantContent.includes("Possible Causes") ||
          assistantContent.includes("Severity Level");

        if (isMedicalAnalysis) {
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
            await invalidateCache("symptom_history");
            showSuccess("Saved to history", "This analysis has been added to your health records");
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      dismissLoading();
      const errorMsg = error instanceof Error ? error.message : "Failed to get AI response. Please try again.";
      showError("Analysis failed", errorMsg);
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

  const renderHistoryList = () => {
    if (sessionsLoading) {
      return (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading history...
        </div>
      );
    }

    if (sessions.length === 0) {
      return (
        <div className="text-center py-8 text-sm text-muted-foreground px-4">
          No previous sessions found. Start a conversation to save one!
        </div>
      );
    }

    return (
      <div className="space-y-1 p-2 overflow-y-auto flex-1 select-none">
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <div
              key={session.id}
              className={`group flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <button
                onClick={() => handleSelectSession(session.id)}
                className="flex-1 text-left truncate pr-2 focus:outline-none"
              >
                {session.title || "Untitled Session"}
              </button>

              {/* FIX: AlertDialog wraps the trash button so delete requires confirmation */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20 ${
                      isActive
                        ? "text-primary-foreground/80 hover:text-primary-foreground"
                        : "text-muted-foreground hover:text-destructive"
                    }`}
                    title="Delete Session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
                    <AlertDialogDescription>
                      "{session.title || "Untitled Session"}" will be permanently deleted. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteSession(session.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-full w-full min-h-0 bg-background/55 text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] border-r border-border bg-slate-950/20 shrink-0">
        <div className="p-4 border-b border-border flex flex-col gap-2">
          <Button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-glow font-semibold"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>
        <div className="flex-1 flex flex-col min-h-0 py-2">
          <div className="px-4 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Conversations
          </div>
          {renderHistoryList()}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Mobile Header */}
        <header className="flex items-center justify-between p-3 border-b border-border bg-card/50 md:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0 flex flex-col bg-background">
                <SheetHeader className="p-4 border-b border-border">
                  <SheetTitle className="text-left flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Chat History
                  </SheetTitle>
                </SheetHeader>
                <div className="p-4 border-b border-border">
                  <Button
                    onClick={handleNewChat}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-glow font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    New Chat
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto flex flex-col py-2 min-h-0">
                  {renderHistoryList()}
                </div>
              </SheetContent>
            </Sheet>
            <span className="text-sm font-semibold truncate max-w-[150px]">
              {activeSessionId
                ? sessions.find((s) => s.id === activeSessionId)?.title || "Active Chat"
                : "New Chat"}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleNewChat} className="text-xs flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            New
          </Button>
        </header>

        {/* Message Panel */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 p-4">
          {messages.map((message, index) => (
            <ChatMessage key={index} role={message.role} content={message.content} />
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <ChatLoading />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Panel — FIX: char counter + Enter hint */}
        <div className="border-t border-border bg-card/65 p-4 shrink-0">
          <div className="flex gap-2 items-start">
            <div className="flex-1 flex flex-col gap-1.5">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={handleKeyPress}
                placeholder="Describe your symptoms... (e.g., 'I have a sore throat and headache')"
                className="min-h-[60px] max-h-[120px] resize-none rounded-xl"
                disabled={isLoading}
              />
              <div className="flex items-center justify-between px-1">
                <p className="text-xs text-muted-foreground select-none">
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">Enter</kbd>
                  {" "}to send{" · "}
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">Shift+Enter</kbd>
                  {" "}for new line
                </p>
                <p
                  className={`text-xs tabular-nums select-none transition-colors ${
                    input.length >= MAX_CHARS
                      ? "text-destructive font-semibold"
                      : input.length >= MAX_CHARS * 0.85
                      ? "text-orange-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {input.length}/{MAX_CHARS}
                </p>
              </div>
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[60px] w-[60px] flex-shrink-0 rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
