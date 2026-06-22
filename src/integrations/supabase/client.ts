// src/integrations/supabase/client.ts

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// ─── Env resolution ───────────────────────────────────────────────────────────
const rawEnv = import.meta.env as ImportMetaEnv & Record<string, string | undefined>;

const supabaseUrl = rawEnv.VITE_SUPABASE_URL?.trim() ?? "";
const publishableKey = rawEnv.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
const legacyAnonKey = rawEnv.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

// Accept the legacy key name so existing .env files keep working, but surface
// a warning so developers know to rename it.
export const supabasePublishableKey = publishableKey || legacyAnonKey;

if (!publishableKey && legacyAnonKey) {
  console.warn(
    "[Supabase] VITE_SUPABASE_ANON_KEY is deprecated. " +
      "Rename it to VITE_SUPABASE_PUBLISHABLE_KEY in your .env file."
  );
}

// ─── Startup validation ───────────────────────────────────────────────────────
const missing: string[] = [];
if (!supabaseUrl) missing.push("VITE_SUPABASE_URL");
if (!supabasePublishableKey) missing.push("VITE_SUPABASE_PUBLISHABLE_KEY");

if (missing.length > 0) {
  throw new Error(
    `[Supabase] Missing required environment variable(s):\n` +
      missing.map((v) => `  - ${v}`).join("\n") +
      `\nCopy .env.example to .env and fill in the values.`
  );
}

export { supabaseUrl };

// ─── Client ───────────────────────────────────────────────────────────────────
export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});
