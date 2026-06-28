import { supabase } from "@/integrations/supabase/client";

export type CachedTable = "profiles" | "symptom_history" | "health_metrics" | "chat_sessions";

/**
 * Fetches cached query results for the current user and the specified table.
 */
export async function getCachedData<T = unknown>(table: CachedTable): Promise<{ data: T | null; error: unknown }> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "get-cached-data",
      {
        body: { table },
      }
    );
    if (error && typeof error === 'object' && 'context' in error) {
      try {
        const body = await (error as any).context.json();
        return { data: null, error: body.error || body };
      } catch (_) {}
    }
    return { data: data as T, error };
  } catch (err) {
    console.error(`Error invoking get-cached-data for table ${table}:`, err);
    return { data: null, error: err };
  }
}

/**
 * Invalidates the Redis cache for the current user and the specified table.
 */
export async function invalidateCache(table: CachedTable): Promise<{ success: boolean; error: unknown }> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "invalidate-cache",
      {
        body: { table },
      }
    );
    if (error && typeof error === 'object' && 'context' in error) {
      try {
        const body = await (error as any).context.json();
        return { success: false, error: body.error || body };
      } catch (_) {}
    }
    return { success: !error && data?.success, error };
  } catch (err) {
    console.error(`Error invoking invalidate-cache for table ${table}:`, err);
    return { success: false, error: err };
  }
}
