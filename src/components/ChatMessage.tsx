import type { ReactNode } from "react";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

const stripBold = (value: string) => value.replace(/\*\*/g, "").trim();

const renderInline = (value: string) =>
  value.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-foreground">
          {stripBold(part)}
        </strong>
      );
    }

    return part;
  });

const getSeverityClassName = (severity: string) => {
  const normalized = severity.toLowerCase();

  if (normalized.includes("high")) {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }

  if (normalized.includes("moderate")) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }

  return "border-secondary/30 bg-secondary/10 text-secondary";
};

const renderAssistantContent = (content: string): ReactNode => {
  const lines = content.split(/\r?\n/);

  return (
    <div className="space-y-3">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return null;
        }

        const severityMatch = trimmed.match(/^\*\*Severity Level:\*\*\s*(.+)$/i);
        if (severityMatch) {
          const severity = stripBold(severityMatch[1]);

          return (
            <div key={`${trimmed}-${index}`} className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Severity Level
              </span>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-semibold",
                  getSeverityClassName(severity)
                )}
              >
                {severity}
              </span>
            </div>
          );
        }

        const headingMatch = trimmed.match(/^\*\*(.+?):\*\*\s*(.*)$/);
        if (headingMatch) {
          const title = stripBold(headingMatch[1]);
          const rest = headingMatch[2]?.trim();
          const isImportant = title.toLowerCase().includes("important");

          if (isImportant) {
            return (
              <div
                key={`${trimmed}-${index}`}
                className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm leading-6"
              >
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  {title}:
                </span>{" "}
                <span className="text-muted-foreground">{renderInline(rest)}</span>
              </div>
            );
          }

          return (
            <div key={`${trimmed}-${index}`} className="pt-1">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              {rest && (
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {renderInline(rest)}
                </p>
              )}
            </div>
          );
        }

        if (trimmed.startsWith("- ")) {
          return (
            <div key={`${trimmed}-${index}`} className="flex gap-2 text-sm leading-6">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
              <span className="text-card-foreground">{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        return (
          <p key={`${trimmed}-${index}`} className="text-sm leading-6 text-card-foreground">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

const ChatMessage = ({ role, content }: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
      )}
      
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 shadow-soft",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground border border-border"
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{content}</div>
        ) : (
          renderAssistantContent(content)
        )}
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <User className="w-5 h-5 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
