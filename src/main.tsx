import { createRoot } from "react-dom/client";
import { browserEnv } from "./lib/env";
import StartupDiagnostics from "./components/StartupDiagnostics";
import "./index.css";

import ErrorBoundary from "./components/ErrorBoundary";

import { ThemeProvider } from "./components/theme-provider";


const root = createRoot(document.getElementById("root")!);
const AppLoadError = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
    <div className="max-w-md space-y-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
      <h1 className="text-xl font-semibold text-foreground">Unable to load the app</h1>
      <p className="text-sm leading-6 text-muted-foreground">
        Please refresh the page. If the problem continues, check the network connection or try again later.
      </p>
    </div>
  </div>
);

if (browserEnv.diagnostics.warnings.length > 0) {
	console.warn("Startup configuration warnings:", browserEnv.diagnostics.warnings);
}

if (!browserEnv.diagnostics.isValid) {
	console.error("Startup configuration missing:", browserEnv.diagnostics.missingRequired);

	root.render(<StartupDiagnostics />);
} else {
  void import("./App.tsx").then(({ default: App }) => {
    root.render(
      <ErrorBoundary>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }).catch((error) => {
    console.error("Failed to load App:", error);
    root.render(<AppLoadError />);
  });
}
