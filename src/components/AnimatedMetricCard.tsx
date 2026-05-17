import { ReactNode, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

interface AnimatedMetricCardProps {
  /** Card label */
  title: string;
  /** Numeric value to count up to */
  value: number;
  /** Optional suffix appended to the number, e.g. "/100" */
  suffix?: string;
  /** Sub-label below the count */
  description: string;
  /** Lucide icon element */
  icon: ReactNode;
  /** Stagger delay before entrance animation fires (ms). Default 0. */
  delay?: number;
  /** Tailwind classes for the icon badge (text + bg). */
  accentClass?: string;
  /** When true, renders a thin progress bar below description */
  showProgress?: boolean;
  /** Denominator for the progress bar. Default 100. */
  progressMax?: number;
}

/**
 * A shadcn `Card` with:
 *  - Fade + slide-up entrance (IntersectionObserver-triggered, staggered via `delay`)
 *  - Animated count-up number using `useCountUp`
 *  - Hover: lift (-translate-y-1.5), soft glow shadow, gradient shimmer overlay
 *  - Icon badge: scale + slight rotation on hover
 *  - Optional progress bar that also animates in
 */
export function AnimatedMetricCard({
  title,
  value,
  suffix = "",
  description,
  icon,
  delay = 0,
  accentClass = "text-primary bg-primary/10",
  showProgress = false,
  progressMax = 100,
}: AnimatedMetricCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Fire entrance animation once when the card scrolls into view
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setTimeout(() => setVisible(true), delay);
          observer.unobserve(el);
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  // Animated number
  const displayCount = useCountUp({ end: value, enabled: visible, duration: 1500 });

  // Animated progress bar width (0 → percentage)
  const rawProgress = progressMax > 0 ? Math.min((value / progressMax) * 100, 100) : 0;
  const progressWidth = useCountUp({
    end: rawProgress,
    enabled: visible,
    duration: 1600,
    decimals: 1,
  });

  return (
    <div
      ref={ref}
      className={cn(
        // Entrance: hidden → visible transition driven by `visible` state
        "transition-all duration-700 ease-out will-change-transform",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      )}
    >
      <Card
        className={cn(
          "group relative overflow-hidden border-border",
          // Hover: lift + glow shadow + border tint
          "hover:-translate-y-1.5 hover:shadow-lg hover:shadow-primary/10",
          "hover:border-primary/30 transition-all duration-300 cursor-default"
        )}
      >
        {/* Gradient shimmer — fades in on hover */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      pointer-events-none rounded-[inherit]"
          aria-hidden="true"
        />

        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>

          {/* Icon badge — scales + rotates slightly on hover */}
          <div
            className={cn(
              "p-2 rounded-lg transition-all duration-300",
              "group-hover:scale-110 group-hover:rotate-6",
              accentClass
            )}
          >
            {icon}
          </div>
        </CardHeader>

        <CardContent>
          {/* Animated counter — tabular-nums prevents layout jitter */}
          <div className="text-3xl font-bold tabular-nums tracking-tight">
            {displayCount}
            {suffix}
          </div>

          <p className="text-xs text-muted-foreground mt-1">{description}</p>

          {/* Optional progress bar */}
          {showProgress && (
            <div className="mt-3" aria-label={`${Math.round(rawProgress)}% of max`}>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-none"
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
