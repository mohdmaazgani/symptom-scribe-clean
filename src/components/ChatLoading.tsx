import { Loader2 } from "lucide-react";

const ChatLoading = () => {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center animate-pulse">
        <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
      </div>

      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-card border border-border">
        <div className="flex gap-1">
          <span
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatLoading;