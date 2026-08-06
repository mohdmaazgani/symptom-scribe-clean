import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  ctaText,
  onCtaClick,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-4 gap-4 animate-in fade-in duration-300 ${className}`}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950">
        {icon}
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
        )}
      </div>
      {ctaText && onCtaClick && (
        <Button
          onClick={onCtaClick}
          className="bg-teal-600 hover:bg-teal-700 text-white mt-2"
        >
          {ctaText}
        </Button>
      )}
    </div>
  );
}
