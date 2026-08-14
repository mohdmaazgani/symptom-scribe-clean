import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

const ChatMessage = ({ role, content }: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3 animate-fade-in", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center chat-avatar-ring">
          <Bot className="w-4 h-4 text-primary-foreground" />
          <span className="sr-only">AI Health Assistant:</span>
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 transition-shadow duration-200",
          isUser
            ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-md"
            : "bg-card/80 backdrop-blur-sm text-card-foreground border border-border/60 shadow-soft chat-msg-accent"
        )}
      >
        <div className="text-sm leading-relaxed">
          <span className="sr-only">{isUser ? "You said: " : "AI Health Assistant said: "}</span>
          <ReactMarkdown
            components={{
              strong: ({ children }) => (
                <strong className="font-bold text-card-foreground">{children}</strong>
              ),

              ul: ({ children }) => <ul className="list-disc pl-5 space-y-1.5 my-1">{children}</ul>,

              li: ({ children }) => (
                <li className="text-card-foreground leading-relaxed">{children}</li>
              ),

              p: ({ children }) => (
                <p className="mb-2.5 last:mb-0 text-card-foreground">{children}</p>
              ),
            }}
          >
            {content.replace(/•/g, "-")}
          </ReactMarkdown>
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center chat-avatar-ring">
          <User className="w-4 h-4 text-secondary-foreground" />
          <span className="sr-only">You:</span>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
