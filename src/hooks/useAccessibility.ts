import { useState, useEffect, useCallback } from "react";

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

const VALID_FONT_SIZES: FontSize[] = ["normal", "large", "x-large"];

function isValidFontSize(value: unknown): value is FontSize {
  return VALID_FONT_SIZES.includes(value as FontSize);
}

function loadSettings(): AccessibilitySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(stored);

    return {
      fontSize: isValidFontSize(parsed.fontSize)
        ? parsed.fontSize
        : DEFAULT_SETTINGS.fontSize,

      highContrast:
        typeof parsed.highContrast === "boolean"
          ? parsed.highContrast
          : DEFAULT_SETTINGS.highContrast,

      dyslexiaFont:
        typeof parsed.dyslexiaFont === "boolean"
          ? parsed.dyslexiaFont
          : DEFAULT_SETTINGS.dyslexiaFont,

      reducedMotion:
        typeof parsed.reducedMotion === "boolean"
          ? parsed.reducedMotion
          : DEFAULT_SETTINGS.reducedMotion,

      improvedSpacing:
        typeof parsed.improvedSpacing === "boolean"
          ? parsed.improvedSpacing
          : DEFAULT_SETTINGS.improvedSpacing,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
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

  // Apply CSS classes whenever settings change
  useEffect(() => {
    applyClasses(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore storage errors
    }
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
