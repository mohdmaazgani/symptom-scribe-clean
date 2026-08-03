import { useAccessibilityContext } from "@/components/accessibility/AccessibilityContext";
import type { FontSize } from "@/components/accessibility/AccessibilityContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Accessibility, Type, Contrast, RotateCcw, Space, Zap } from "lucide-react";

const FONT_SIZES: { value: FontSize; label: string; description: string }[] = [
  { value: "normal", label: "Normal", description: "Default text size" },
  { value: "large", label: "Large", description: "125% — easier to read" },
  { value: "x-large", label: "X-Large", description: "150% — maximum readability" },
];

const AccessibilitySettings = () => {
  const { settings, updateSetting, resetSettings } = useAccessibilityContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Accessibility className="w-5 h-5" />
          Accessibility Mode
        </CardTitle>
        <CardDescription>
          Adjust visual and interaction settings to improve readability and usability.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Font Size */}
        <section aria-labelledby="font-size-label">
          <div className="flex items-center gap-2 mb-3">
            <Type className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <span id="font-size-label" className="text-sm font-medium">
              Font Size
            </span>
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="font-size-label">
            {FONT_SIZES.map(({ value, label, description }) => (
              <button
                key={value}
                role="radio"
                aria-checked={settings.fontSize === value}
                onClick={() => updateSetting("fontSize", value)}
                className={[
                  "px-4 py-2 rounded-md border text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  settings.fontSize === value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:bg-muted",
                ].join(" ")}
                title={description}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Current:{" "}
            {FONT_SIZES.find((f) => f.value === settings.fontSize)?.description}
          </p>
        </section>

        <Separator />

        {/* High Contrast */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Contrast className="w-4 h-4 mt-0.5 text-muted-foreground" aria-hidden="true" />
            <div>
              <Label htmlFor="high-contrast" className="text-sm font-medium cursor-pointer">
                High-Contrast Mode
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Increases colour contrast for better visibility
              </p>
            </div>
          </div>
          <Switch
            id="high-contrast"
            checked={settings.highContrast}
            onCheckedChange={(val) => updateSetting("highContrast", val)}
          />
        </div>

        <Separator />

        {/* Dyslexia-Friendly Font */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Type className="w-4 h-4 mt-0.5 text-muted-foreground" aria-hidden="true" />
            <div>
              <Label htmlFor="dyslexia-font" className="text-sm font-medium cursor-pointer">
                Dyslexia-Friendly Font
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Uses OpenDyslexic — a typeface designed to improve readability for dyslexic users
              </p>
            </div>
          </div>
          <Switch
            id="dyslexia-font"
            checked={settings.dyslexiaFont}
            onCheckedChange={(val) => updateSetting("dyslexiaFont", val)}
          />
        </div>

        <Separator />

        {/* Improved Spacing */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Space className="w-4 h-4 mt-0.5 text-muted-foreground" aria-hidden="true" />
            <div>
              <Label htmlFor="improved-spacing" className="text-sm font-medium cursor-pointer">
                Improved Spacing
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Increases line height and letter spacing for easier reading
              </p>
            </div>
          </div>
          <Switch
            id="improved-spacing"
            checked={settings.improvedSpacing}
            onCheckedChange={(val) => updateSetting("improvedSpacing", val)}
          />
        </div>

        <Separator />

        {/* Reduced Motion */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Zap className="w-4 h-4 mt-0.5 text-muted-foreground" aria-hidden="true" />
            <div>
              <Label htmlFor="reduced-motion" className="text-sm font-medium cursor-pointer">
                Reduce Motion
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Disables non-essential animations and transitions
              </p>
            </div>
          </div>
          <Switch
            id="reduced-motion"
            checked={settings.reducedMotion}
            onCheckedChange={(val) => updateSetting("reducedMotion", val)}
          />
        </div>

        <Separator />

        {/* Reset */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={resetSettings}
            className="gap-2"
            aria-label="Reset all accessibility settings to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccessibilitySettings;
