import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * ThemeToggle — Accessible sun/moon icon button.
 * Uses a `mounted` guard to avoid SSR/hydration mismatch.
 * Reads `resolvedTheme` so "system" preference is handled transparently.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render after mount to prevent hydration flash
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder with the same size to avoid layout shift
    return (
      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9"
        aria-label="Toggle theme"
        disabled
      >
        <span className="w-4 h-4 block" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      id="theme-toggle-btn"
      variant="ghost"
      size="icon"
      className="w-9 h-9 relative overflow-hidden"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {/* Sun icon — visible in dark mode */}
      <Sun
        className={`h-4 w-4 absolute transition-all duration-300 ease-in-out ${
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        }`}
        aria-hidden="true"
      />
      {/* Moon icon — visible in light mode */}
      <Moon
        className={`h-4 w-4 absolute transition-all duration-300 ease-in-out ${
          isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        }`}
        aria-hidden="true"
      />
    </Button>
  );
}
