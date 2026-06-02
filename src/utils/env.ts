type BrowserEnvDiagnostics = {
  isValid: boolean;
  missingRequired: string[];
  warnings: string[];
  legacyKeyUsed: boolean;
};

type BrowserEnv = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  diagnostics: BrowserEnvDiagnostics;
  getSupabaseFunctionUrl: (functionName: string) => string;
};

const rawEnv = import.meta.env as ImportMetaEnv & Record<string, string | undefined>;

const requiredVariables = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"] as const;

const normalize = (value: string | undefined) => value?.trim() || "";

const supabaseUrl = normalize(rawEnv.VITE_SUPABASE_URL);
const publishableKey = normalize(rawEnv.VITE_SUPABASE_PUBLISHABLE_KEY);
const legacyAnonKey = normalize(rawEnv.VITE_SUPABASE_ANON_KEY);

const effectiveSupabaseKey = publishableKey || legacyAnonKey;

const missingRequired = requiredVariables.filter((variable) => {
  if (variable === "VITE_SUPABASE_URL") {
    return !supabaseUrl;
  }

  return !effectiveSupabaseKey;
});

const warnings = [] as string[];

if (!publishableKey && legacyAnonKey) {
  warnings.push(
    "Using legacy VITE_SUPABASE_ANON_KEY fallback. Rename it to VITE_SUPABASE_PUBLISHABLE_KEY."
  );
}

const diagnostics: BrowserEnvDiagnostics = {
  isValid: missingRequired.length === 0,
  missingRequired,
  warnings,
  legacyKeyUsed: !publishableKey && Boolean(legacyAnonKey),
};

export const browserEnv: BrowserEnv = {
  supabaseUrl,
  supabasePublishableKey: effectiveSupabaseKey,
  diagnostics,
  getSupabaseFunctionUrl: (functionName: string) => {
    return new URL(`functions/v1/${functionName}`, supabaseUrl).toString();
  },
};

