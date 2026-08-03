import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type FontSize = "normal" | "medium" | "large" | "xlarge";

export interface AccessibilitySettings {
  fontSize: FontSize;
  highContrast: boolean;
  dyslexiaFont: boolean;
  increasedSpacing: boolean;
  focusHighlight: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: "normal",
  highContrast: false,
  dyslexiaFont: false,
  increasedSpacing: false,
  focusHighlight: false,
};

const STORAGE_KEY = "symptom-scribe-accessibility";

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  setFontSize: (size: FontSize) => void;
  setHighContrast: (enabled: boolean) => void;
  setDyslexiaFont: (enabled: boolean) => void;
  setIncreasedSpacing: (enabled: boolean) => void;
  setFocusHighlight: (enabled: boolean) => void;
  resetDefaults: () => void;
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  announcement: string;
  announce: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error("Failed to load accessibility settings:", e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
    // Clear after announcement so repeat messages can re-trigger if needed
    setTimeout(() => {
      setAnnouncement("");
    }, 3000);
  }, []);

  // Update DOM classes whenever settings change
  useEffect(() => {
    const root = document.documentElement;

    // Font size classes
    root.classList.remove("a11y-font-medium", "a11y-font-large", "a11y-font-xlarge");
    if (settings.fontSize !== "normal") {
      root.classList.add(`a11y-font-${settings.fontSize}`);
    }

    // High Contrast
    if (settings.highContrast) {
      root.classList.add("a11y-high-contrast");
    } else {
      root.classList.remove("a11y-high-contrast");
    }

    // Dyslexia-friendly Font
    if (settings.dyslexiaFont) {
      root.classList.add("a11y-dyslexia-font");
    } else {
      root.classList.remove("a11y-dyslexia-font");
    }

    // Increased Spacing
    if (settings.increasedSpacing) {
      root.classList.add("a11y-increased-spacing");
    } else {
      root.classList.remove("a11y-increased-spacing");
    }

    // Focus Highlight
    if (settings.focusHighlight) {
      root.classList.add("a11y-focus-highlight");
    } else {
      root.classList.remove("a11y-focus-highlight");
    }

    // Persist to local storage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save accessibility settings:", e);
    }
  }, [settings]);

  // Global Keyboard Shortcut (Alt + A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        setIsPanelOpen((prev) => {
          const next = !prev;
          announce(next ? "Accessibility settings opened" : "Accessibility settings closed");
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [announce]);

  const setFontSize = useCallback(
    (size: FontSize) => {
      setSettings((prev) => ({ ...prev, fontSize: size }));
      const sizeLabels: Record<FontSize, string> = {
        normal: "Default font size",
        medium: "Medium font size",
        large: "Large font size",
        xlarge: "Extra Large font size",
      };
      announce(`Font size changed to ${sizeLabels[size]}`);
    },
    [announce]
  );

  const setHighContrast = useCallback(
    (enabled: boolean) => {
      setSettings((prev) => ({ ...prev, highContrast: enabled }));
      announce(enabled ? "High contrast mode enabled" : "High contrast mode disabled");
    },
    [announce]
  );

  const setDyslexiaFont = useCallback(
    (enabled: boolean) => {
      setSettings((prev) => ({ ...prev, dyslexiaFont: enabled }));
      announce(enabled ? "Dyslexia-friendly font enabled" : "Dyslexia-friendly font disabled");
    },
    [announce]
  );

  const setIncreasedSpacing = useCallback(
    (enabled: boolean) => {
      setSettings((prev) => ({ ...prev, increasedSpacing: enabled }));
      announce(enabled ? "Increased spacing enabled" : "Increased spacing disabled");
    },
    [announce]
  );

  const setFocusHighlight = useCallback(
    (enabled: boolean) => {
      setSettings((prev) => ({ ...prev, focusHighlight: enabled }));
      announce(
        enabled
          ? "High visibility focus indicators enabled"
          : "High visibility focus indicators disabled"
      );
    },
    [announce]
  );

  const resetDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    announce("Accessibility settings reset to default");
  }, [announce]);

  const togglePanel = useCallback(() => {
    setIsPanelOpen((prev) => {
      const next = !prev;
      announce(next ? "Accessibility settings opened" : "Accessibility settings closed");
      return next;
    });
  }, [announce]);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        setFontSize,
        setHighContrast,
        setDyslexiaFont,
        setIncreasedSpacing,
        setFocusHighlight,
        resetDefaults,
        isPanelOpen,
        setIsPanelOpen,
        togglePanel,
        announcement,
        announce,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
};
