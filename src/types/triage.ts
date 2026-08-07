export type TriagePhase = "gathering" | "ready" | "complete";

export interface CollectedInfo {
  symptom?: string | null;
  duration?: string | null;
  severity?: string | null;
  associatedSymptoms?: string[] | null;
  triggers?: string | null;
}
