import { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useTypewriter } from "@/hooks/use-typewriter";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  animate?: boolean;
  onAnimationComplete?: () => void;
}

const ChatMessage = ({ role, content, animate = false, onAnimationComplete }: ChatMessageProps) => {
  const isUser = role === "user";
  const messageRef = useRef<HTMLDivElement>(null);

  const { displayedText, isFinished, skip } = useTypewriter(
    content,
    25,
    role === "assistant" && animate
  );

  useEffect(() => {
    if (isFinished && onAnimationComplete) {
      onAnimationComplete();
    }
  }, [isFinished, onAnimationComplete]);

  useEffect(() => {
    if (animate && !isFinished && messageRef.current) {
      const container = messageRef.current.closest(".overflow-y-auto");
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (isNearBottom) {
          container.scrollTop = container.scrollHeight;
        }
      }
    }
  }, [displayedText, animate, isFinished]);

  return (
    <div
      ref={messageRef}
      onClick={!isUser && !isFinished ? skip : undefined}
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "justify-end" : "justify-start",
        !isUser && !isFinished ? "cursor-pointer select-none" : ""
      )}
      title={!isUser && !isFinished ? "Click to reveal full text" : undefined}
    >
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
            {displayedText.replace(/•/g, "-")}
          </ReactMarkdown>
          {!isUser && !isFinished && (
            <span className="inline-block w-1.5 h-3 ml-1 bg-primary/70 animate-pulse align-middle" aria-hidden="true" />
          )}
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
