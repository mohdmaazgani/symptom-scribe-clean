export type TriagePhase = "gathering" | "ready" | "complete";

export interface CollectedInfo {
  symptom?: string | null;
  duration?: string | null;
  severity?: string | null;
  associatedSymptoms?: string[] | null;
  triggers?: string | null;
}

export interface TriageState {
  phase: TriagePhase;
  collectedInfo: CollectedInfo;
  questionsAsked: number;
  parseFailures: number;
}

export interface TriageResult {
  nextPhase: TriagePhase;
  nextCollectedInfo: CollectedInfo;
  nextQuestionsAsked: number;
  nextParseFailures: number;
  shouldRunAnalysis: boolean;
  fallbackText?: string | null;
}

export function evaluateTriageState(
  state: TriageState,
  responseText: string | null,
  isEmergency: boolean
): TriageResult {
  if (isEmergency) {
    return {
      nextPhase: "ready",
      nextCollectedInfo: state.collectedInfo,
      nextQuestionsAsked: state.questionsAsked,
      nextParseFailures: state.parseFailures,
      shouldRunAnalysis: true,
    };
  }

  let { phase, collectedInfo, questionsAsked, parseFailures } = state;

  // Force transition if questionsAsked >= 4
  if (phase === "gathering" && questionsAsked >= 4) {
    return {
      nextPhase: "ready",
      nextCollectedInfo: collectedInfo,
      nextQuestionsAsked: questionsAsked,
      nextParseFailures: parseFailures,
      shouldRunAnalysis: true,
    };
  }

  if (phase === "gathering") {
    if (!responseText) {
      return {
        nextPhase: "gathering",
        nextCollectedInfo: collectedInfo,
        nextQuestionsAsked: questionsAsked,
        nextParseFailures: parseFailures,
        shouldRunAnalysis: false,
      };
    }

    if (responseText.includes("READY_FOR_ANALYSIS")) {
      const markerIndex = responseText.indexOf("READY_FOR_ANALYSIS");
      const jsonPart = responseText.substring(markerIndex + "READY_FOR_ANALYSIS".length).trim();
      try {
        const parsed = JSON.parse(jsonPart);
        const nextCollectedInfo: CollectedInfo = {
          symptom: parsed.symptom || collectedInfo.symptom || null,
          duration: parsed.duration || collectedInfo.duration || null,
          severity: parsed.severity || collectedInfo.severity || null,
          associatedSymptoms: parsed.associatedSymptoms || collectedInfo.associatedSymptoms || [],
          triggers: parsed.triggers || collectedInfo.triggers || null,
        };

        return {
          nextPhase: "ready",
          nextCollectedInfo,
          nextQuestionsAsked: questionsAsked,
          nextParseFailures: parseFailures,
          shouldRunAnalysis: true,
        };
      } catch (err) {
        console.error("Failed to parse triage JSON:", err);
        const nextParseFailures = parseFailures + 1;
        if (nextParseFailures >= 2) {
          return {
            nextPhase: "ready",
            nextCollectedInfo: collectedInfo,
            nextQuestionsAsked: questionsAsked,
            nextParseFailures: nextParseFailures,
            shouldRunAnalysis: true,
          };
        } else {
          return {
            nextPhase: "gathering",
            nextCollectedInfo: collectedInfo,
            nextQuestionsAsked: questionsAsked + 1,
            nextParseFailures: nextParseFailures,
            shouldRunAnalysis: false,
            fallbackText: "I want to make sure I have all the details. Could you please specify how long you've had these symptoms, their severity (e.g., on a 1-10 scale), and any triggers?",
          };
        }
      }
    } else {
      // Normal question
      return {
        nextPhase: "gathering",
        nextCollectedInfo: collectedInfo,
        nextQuestionsAsked: questionsAsked + 1,
        nextParseFailures: parseFailures,
        shouldRunAnalysis: false,
      };
    }
  }

  // If we are already in ready or complete phase
  return {
    nextPhase: "complete",
    nextCollectedInfo: collectedInfo,
    nextQuestionsAsked: questionsAsked,
    nextParseFailures: parseFailures,
    shouldRunAnalysis: true,
  };
}
