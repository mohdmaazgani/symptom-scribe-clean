import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="symptom-scribe-theme"
      themes={[
        "light",
        "dark",
        "cosmic",
        "deep-blue",
        "forest",
        "orange",
        "pastel-pink",
      ]}
    >
      {children}
    </NextThemesProvider>
  );
}