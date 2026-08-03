import { ReactNode } from "react";
import { useAccessibility } from "@/hooks/useAccessibility";
import { AccessibilityContext } from "./AccessibilityContext";

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const value = useAccessibility();
  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}
