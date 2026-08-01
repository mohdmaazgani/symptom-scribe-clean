import React from "react";
import { useAccessibility, FontSize } from "./AccessibilityContext.tsx";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Type,
  Sun,
  BookOpen,
  Maximize2,
  Focus,
  RotateCcw,
  Accessibility as AccessibilityIcon,
  X,
  Keyboard,
} from "lucide-react";

interface AccessibilityPanelProps {
  isModal?: boolean;
  onClose?: () => void;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  isModal = false,
  onClose,
}) => {
  const {
    settings,
    setFontSize,
    setHighContrast,
    setDyslexiaFont,
    setIncreasedSpacing,
    setFocusHighlight,
    resetDefaults,
  } = useAccessibility();

  const fontOptions: { value: FontSize; label: string; sub: string }[] = [
    { value: "normal", label: "Normal", sub: "100%" },
    { value: "medium", label: "Medium", sub: "112.5%" },
    { value: "large", label: "Large", sub: "125%" },
    { value: "xlarge", label: "Extra Large", sub: "137.5%" },
  ];

  const content = (
    <div className="space-y-6">
      {/* 1. Larger Font Sizes */}
      <section aria-labelledby="a11y-font-size-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-primary" aria-hidden="true" />
          <h3 id="a11y-font-size-heading" className="font-semibold text-base">
            Text Size
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Adjust the global text scale across the application for clearer reading.
        </p>
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
          role="group"
          aria-label="Font size selection"
        >
          {fontOptions.map((opt) => {
            const isActive = settings.fontSize === opt.value;
            return (
              <Button
                key={opt.value}
                type="button"
                variant={isActive ? "default" : "outline"}
                aria-pressed={isActive}
                onClick={() => setFontSize(opt.value)}
                className="flex flex-col h-auto py-2.5 px-3 transition-all"
              >
                <span className="font-medium text-sm">{opt.label}</span>
                <span className="text-xs opacity-75">{opt.sub}</span>
              </Button>
            );
          })}
        </div>
      </section>

      <hr className="border-border opacity-50" />

      {/* 2. High-Contrast Mode */}
      <section
        aria-labelledby="a11y-contrast-heading"
        className="flex items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-primary" aria-hidden="true" />
            <h3 id="a11y-contrast-heading" className="font-semibold text-base">
              High-Contrast Mode
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Enhances text and element boundaries to meet WCAG AAA high contrast guidelines.
          </p>
        </div>
        <Switch
          id="a11y-high-contrast-toggle"
          checked={settings.highContrast}
          onCheckedChange={setHighContrast}
          aria-labelledby="a11y-contrast-heading"
        />
      </section>

      <hr className="border-border opacity-50" />

      {/* 3. Dyslexia-Friendly Font */}
      <section aria-labelledby="a11y-dyslexia-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" aria-hidden="true" />
              <h3 id="a11y-dyslexia-heading" className="font-semibold text-base">
                Dyslexia-Friendly Font
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Switches typography to Atkinson Hyperlegible to improve readability and character
              distinction.
            </p>
          </div>
          <Switch
            id="a11y-dyslexia-toggle"
            checked={settings.dyslexiaFont}
            onCheckedChange={setDyslexiaFont}
            aria-labelledby="a11y-dyslexia-heading"
          />
        </div>
        {settings.dyslexiaFont && (
          <div className="p-3 rounded-md bg-muted/50 border border-primary/20 text-sm italic">
            Sample text:{" "}
            <span className="font-semibold">
              The quick brown fox jumps over the lazy dog. 1234567890
            </span>
          </div>
        )}
      </section>

      <hr className="border-border opacity-50" />

      {/* 4. Improved Spacing */}
      <section
        aria-labelledby="a11y-spacing-heading"
        className="flex items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-5 h-5 text-primary" aria-hidden="true" />
            <h3 id="a11y-spacing-heading" className="font-semibold text-base">
              Improved Spacing & Line Height
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Increases line height, letter spacing, and paragraph spacing to prevent visual crowding.
          </p>
        </div>
        <Switch
          id="a11y-spacing-toggle"
          checked={settings.increasedSpacing}
          onCheckedChange={setIncreasedSpacing}
          aria-labelledby="a11y-spacing-heading"
        />
      </section>

      <hr className="border-border opacity-50" />

      {/* 5. High Visibility Focus Ring */}
      <section
        aria-labelledby="a11y-focus-heading"
        className="flex items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Focus className="w-5 h-5 text-primary" aria-hidden="true" />
            <h3 id="a11y-focus-heading" className="font-semibold text-base">
              High-Visibility Focus Rings
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Highlights focused elements with a distinct thick yellow outline for easier keyboard
            navigation.
          </p>
        </div>
        <Switch
          id="a11y-focus-toggle"
          checked={settings.focusHighlight}
          onCheckedChange={setFocusHighlight}
          aria-labelledby="a11y-focus-heading"
        />
      </section>

      <hr className="border-border opacity-50" />

      {/* Shortcut hint & Reset Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Keyboard className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span>
            Press{" "}
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">Alt</kbd> +{" "}
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">A</kbd>{" "}
            anytime to toggle settings
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetDefaults}
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Reset Defaults
        </Button>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="a11y-dialog-title"
      >
        <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border-primary/20 bg-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <AccessibilityIcon className="w-6 h-6 text-primary" aria-hidden="true" />
              <div>
                <CardTitle id="a11y-dialog-title" className="text-xl">
                  Accessibility Mode
                </CardTitle>
                <CardDescription>Customize your reading and visual preferences</CardDescription>
              </div>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close accessibility options"
                className="h-8 w-8 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-6">{content}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AccessibilityIcon className="w-6 h-6 text-primary" aria-hidden="true" />
          <div>
            <CardTitle className="text-xl">Accessibility Mode</CardTitle>
            <CardDescription>
              Adjust font sizes, contrast, spacing, and font options for improved readability
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};
