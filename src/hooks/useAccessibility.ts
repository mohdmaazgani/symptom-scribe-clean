import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FontSize = "normal" | "large" | "x-large";

export interface AccessibilitySettings {
  fontSize: FontSize;
  highContrast: boolean;
  dyslexiaFont: boolean;
  reducedMotion: boolean;
  improvedSpacing: boolean;
}

const STORAGE_KEY = "symptom-scribe-accessibility";

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: "normal",
  highContrast: false,
  dyslexiaFont: false,
  reducedMotion: false,
  improvedSpacing: false,
};

function loadSettings(): AccessibilitySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_SETTINGS;
}

function applyClasses(settings: AccessibilitySettings) {
  const root = document.documentElement;

  // Font size classes
  root.classList.remove("a11y-font-large", "a11y-font-x-large");
  if (settings.fontSize === "large") root.classList.add("a11y-font-large");
  if (settings.fontSize === "x-large") root.classList.add("a11y-font-x-large");

  // High contrast
  root.classList.toggle("a11y-high-contrast", settings.highContrast);

  // Dyslexia-friendly font
  root.classList.toggle("a11y-dyslexia-font", settings.dyslexiaFont);

  // Reduced motion
  root.classList.toggle("a11y-reduced-motion", settings.reducedMotion);

  // Improved spacing
  root.classList.toggle("a11y-improved-spacing", settings.improvedSpacing);
}

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(loadSettings);

  // Sync settings from Supabase profile on mount / auth state change
  useEffect(() => {
    let isMounted = true;
    const fetchAccountSettings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("accessibility_settings")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (profile?.accessibility_settings && isMounted) {
          const remoteSettings = profile.accessibility_settings as unknown as AccessibilitySettings;
          setSettings((prev) => ({ ...DEFAULT_SETTINGS, ...prev, ...remoteSettings }));
        }
      } catch (err) {
        console.warn("Failed to fetch remote accessibility settings:", err);
      }
    };

    fetchAccountSettings();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        fetchAccountSettings();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Apply CSS classes whenever settings change and sync to localStorage & Supabase
  useEffect(() => {
    applyClasses(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore storage errors
    }

    // Debounced sync to Supabase profile
    const syncToAccount = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;

        await supabase
          .from("profiles")
          .upsert(
            {
              user_id: session.user.id,
              accessibility_settings: settings as unknown as import("@/integrations/supabase/types").Json,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
      } catch (err) {
        console.warn("Failed to sync accessibility settings to account:", err);
      }
    };

    const timer = setTimeout(syncToAccount, 500);
    return () => clearTimeout(timer);
  }, [settings]);

  const updateSetting = useCallback(
    <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, updateSetting, resetSettings };
}

