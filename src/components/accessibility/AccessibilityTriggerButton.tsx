import React from "react";
import { useAccessibility } from "./AccessibilityContext.tsx";
import { AccessibilityPanel } from "./AccessibilityPanel";
import { Button } from "@/components/ui/button";
import { Accessibility } from "lucide-react";

export const AccessibilityTriggerButton: React.FC = () => {
  const { isPanelOpen, togglePanel, setIsPanelOpen } = useAccessibility();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePanel}
        aria-label="Open Accessibility Mode Settings"
        aria-expanded={isPanelOpen}
        className="relative hover:bg-accent/80 transition-colors"
        title="Accessibility Settings (Alt + A)"
      >
        <Accessibility className="h-5 w-5 text-foreground" />
      </Button>

      {isPanelOpen && <AccessibilityPanel isModal={true} onClose={() => setIsPanelOpen(false)} />}
    </>
  );
};
