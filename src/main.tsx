import { createRoot } from "react-dom/client";
import { browserEnv } from "./lib/env";
import StartupDiagnostics from "./components/StartupDiagnostics";
import "./index.css";

import ErrorBoundary from "./components/ErrorBoundary";

import { ThemeProvider } from "./components/theme-provider";


const root = createRoot(document.getElementById("root")!);

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
  });
}
