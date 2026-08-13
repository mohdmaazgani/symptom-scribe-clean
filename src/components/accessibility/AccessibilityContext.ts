import { createContext, useContext } from "react";
import type { AccessibilitySettings, FontSize } from "@/hooks/useAccessibility";

export interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  resetSettings: () => void;
}

export const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function useAccessibilityContext(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error("useAccessibilityContext must be used inside AccessibilityProvider");
  }
  return ctx;
}

export type { FontSize };
