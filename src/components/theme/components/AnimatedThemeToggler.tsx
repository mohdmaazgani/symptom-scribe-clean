import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { Sun, Moon, Sparkles, Droplet, TreePine, Sunset, Flower } from "lucide-react";
import "../styles/animated-theme-toggler.css";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

export function AnimatedThemeToggler({ className = "" }) {
  // next-themes is the single source of truth for theme state/persistence.
  // `resolvedTheme` is what's actually applied (system -> light/dark).
  const { resolvedTheme, setTheme } = useTheme();

  // next-themes' inline script sets the `dark` class on <html> before
  // React mounts (preventing a page-wide flash). Seed local mount state
  // from that class so the icon itself doesn't flash to the wrong state
  // during the brief window before `resolvedTheme` is available.
  const themes = [
    { value: "light", label: "☀️ Light" },
    { value: "dark", label: "🌙 Dark" },
    { value: "cosmic", label: "🌌 Cosmic" },
    { value: "deep-blue", label: "🔵 Deep Blue" },
    { value: "forest", label: "🌲 Forest Green" },
    { value: "orange", label: "🌅 Orange Sunset" },
    { value: "pastel-pink", label: "🌸 Pastel Pink" },
  ];

  const [mounted, setMounted] = useState(false);
  const [preMountTheme, setPreMountTheme] = useState("light");
  useEffect(() => {
    const root = document.documentElement;
    const activeClass = themes.map((t) => t.value).find((cls) => root.classList.contains(cls));
    setPreMountTheme(activeClass ?? "light");
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (resolvedTheme ?? "light") : preMountTheme;
  const isDark = ["dark", "cosmic", "deep-blue"].includes(currentTheme);
  const duration = 400;

  const syncThemeToAccount = (newTheme: string) => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.id) return;
      supabase
        .from("profiles")
        .upsert(
          {
            user_id: session.user.id,
            theme: newTheme,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .catch((err) => console.warn("Failed to sync theme preference to profile:", err));
    });
  };

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const nextTheme = isDark ? "light" : "dark";

    const applyTheme = () => {
      // Delegate entirely to next-themes: it updates the `class`
      // attribute on <html> and writes to localStorage itself.
      setTheme(nextTheme);
      syncThemeToAccount(nextTheme);
    };

    if (!button) {
      applyTheme();
      return;
    }

    const { top, left, width, height } = button.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const maxRadius = Math.hypot(Math.max(x, viewportWidth - x), Math.max(y, viewportHeight - y));

    // Fallback for browsers that don't support View Transitions API
    if (typeof document.startViewTransition !== "function") {
      applyTheme();
      return;
    }

    const transition = document.startViewTransition(() => {
      flushSync(applyTheme);
    });

    transition?.ready?.then(() => {
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`],
        },
        {
          duration,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`animated-theme-toggler ${className}`.trim()}
          aria-label="Select theme"
        >
          <span className="att-icons" aria-hidden="true">
            <span
              className={`att-icon att-sun ${currentTheme === "light" ? "att-show" : ""}`.trim()}
            >
              <Sun className="h-5 w-5" />
            </span>
            <span
              className={`att-icon att-moon ${currentTheme === "dark" ? "att-show" : ""}`.trim()}
            >
              <Moon className="h-5 w-5" />
            </span>
            <span
              className={`att-icon att-cosmic ${currentTheme === "cosmic" ? "att-show" : ""}`.trim()}
            >
              <Sparkles className="h-5 w-5" />
            </span>
            <span
              className={`att-icon att-deep-blue ${currentTheme === "deep-blue" ? "att-show" : ""}`.trim()}
            >
              <Droplet className="h-5 w-5" />
            </span>
            <span
              className={`att-icon att-forest ${currentTheme === "forest" ? "att-show" : ""}`.trim()}
            >
              <TreePine className="h-5 w-5" />
            </span>
            <span
              className={`att-icon att-orange ${currentTheme === "orange" ? "att-show" : ""}`.trim()}
            >
              <Sunset className="h-5 w-5" />
            </span>
            <span
              className={`att-icon att-pastel-pink ${currentTheme === "pastel-pink" ? "att-show" : ""}`.trim()}
            >
              <Flower className="h-5 w-5" />
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-50">
        <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuRadioGroup
          value={resolvedTheme ?? "light"}
          onValueChange={(value) => setTheme(value)}
        >
          {themes.map((theme) => (
            <DropdownMenuRadioItem key={theme.value} value={theme.value}>
              {theme.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
