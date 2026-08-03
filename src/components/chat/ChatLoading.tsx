import { Loader2 } from "lucide-react";

const ChatLoading = () => {
  return (
    <div className="flex gap-3" role="status" aria-label="AI is typing a response">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center animate-pulse chat-avatar-ring">
        <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
      </div>

      <div className="max-w-[80%] rounded-2xl px-5 py-3.5 bg-card/80 backdrop-blur-sm border border-border/60 shadow-soft chat-msg-accent chat-shimmer">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full bg-primary/70 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-primary/70 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-primary/70 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        <span className="sr-only">AI is typing…</span>
      </div>
    </div>
  );
};

export default ChatLoading;
