import { supabase } from "@/integrations/supabase/client";

const FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-symptom-history`
  : "http://localhost:54321/functions/v1/delete-symptom-history";

export async function deleteSymptomRecord(recordId: string): Promise<{ success: boolean; message: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      deleteMode: "single",
      recordId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete symptom record");
  }

  return await response.json();
}

export async function deleteAllSymptomHistory(): Promise<{ success: boolean; message: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      deleteMode: "all",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete symptom history");
  }

  return await response.json();
}
