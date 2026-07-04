import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type CachedTable = "profiles" | "symptom_history" | "health_metrics" | "chat_sessions";

async function extractFunctionError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      return body?.error ?? error.message ?? "Unknown error from edge function";
    } catch {
      return error.message ?? "Unknown error from edge function";
    }
  }
  if (error instanceof Error) return error.message;
  return String(error);
}


export async function getCachedData<T = unknown>(
  table: CachedTable
): Promise<{ data: T | null; cachedAt: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke("get-cached-data", {
      body: { table },
    });

    if (error) {
      const message = await extractFunctionError(error);
      console.error(`get-cached-data error for table ${table}:`, message);
      return { data: null, cachedAt: null, error: message };
    }

    // get-cached-data now returns { data, cachedAt } so callers can tell
    // exactly how old a given snapshot is, instead of guessing from a
    // duplicated TTL constant or the shape of the data itself.
    const payload = data as { data: T; cachedAt: string } | null;
    return {
      data: payload?.data ?? null,
      cachedAt: payload?.cachedAt ?? null,
      error: null,
    };
  } catch (err) {
    const message = await extractFunctionError(err);
    console.error(`Error invoking get-cached-data for table ${table}:`, message);
    return { data: null, cachedAt: null, error: message };
  }
}

export async function invalidateCache(
  table: CachedTable
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke("invalidate-cache", {
      body: { table },
    });

    if (error) {
      const message = await extractFunctionError(error);
      console.error(`invalidate-cache error for table ${table}:`, message);
      return { success: false, error: message };
    }

    return { success: Boolean(data?.success), error: null };
  } catch (err) {
    const message = await extractFunctionError(err);
    console.error(`Error invoking invalidate-cache for table ${table}:`, message);
    return { success: false, error: message };
  }
}
