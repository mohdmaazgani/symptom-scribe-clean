import { describe, it, expect } from "vitest";
import { evaluateTriageState, type TriageState } from "../../supabase/functions/symptom-analyzer/triageEngine";
import { detectEmergencySymptoms } from "../../supabase/functions/symptom-analyzer/medicalSafety";

describe("Triage Engine - State Transitions", () => {
  it("normal 3-question flow (Scenario 1)", () => {
    // 1. Initial State
    let state: TriageState = {
      phase: "gathering",
      collectedInfo: {},
      questionsAsked: 0,
      parseFailures: 0,
    };

    // User responds, AI asks question 1
    let responseText = "How long have you had this fever?";
    let result = evaluateTriageState(state, responseText, false);
    expect(result.nextPhase).toBe("gathering");
    expect(result.nextQuestionsAsked).toBe(1);
    expect(result.shouldRunAnalysis).toBe(false);

    // Update state for next turn
    state = {
      phase: result.nextPhase,
      collectedInfo: result.nextCollectedInfo,
      questionsAsked: result.nextQuestionsAsked,
      parseFailures: result.nextParseFailures,
    };

    // User responds, AI asks question 2
    responseText = "Is the fever accompanied by chills or body aches?";
    result = evaluateTriageState(state, responseText, false);
    expect(result.nextPhase).toBe("gathering");
    expect(result.nextQuestionsAsked).toBe(2);

    state = {
      phase: result.nextPhase,
      collectedInfo: result.nextCollectedInfo,
      questionsAsked: result.nextQuestionsAsked,
      parseFailures: result.nextParseFailures,
    };

    // User responds, AI concludes triage and outputs READY_FOR_ANALYSIS
    responseText = `Thank you. I am ready to generate the analysis now.
    READY_FOR_ANALYSIS
    {
      "symptom": "headache",
      "duration": "3 days",
      "severity": "moderate",
      "associatedSymptoms": ["chills"],
      "triggers": "stress"
    }`;
    result = evaluateTriageState(state, responseText, false);
    expect(result.nextPhase).toBe("ready");
    expect(result.shouldRunAnalysis).toBe(true);
    expect(result.nextCollectedInfo.symptom).toBe("headache");
    expect(result.nextCollectedInfo.duration).toBe("3 days");
    expect(result.nextCollectedInfo.severity).toBe("moderate");
    expect(result.nextCollectedInfo.associatedSymptoms).toContain("chills");
  });

  it("emergency flow check (Scenario 2)", () => {
    const state: TriageState = {
      phase: "gathering",
      collectedInfo: {},
      questionsAsked: 0,
      parseFailures: 0,
    };

    const messages = [{ content: "I am having the worst headache of my life" }];
    const emergencyCheck = detectEmergencySymptoms(messages);
    expect(emergencyCheck.isEmergency).toBe(true);
    expect(emergencyCheck.matchedKeywords).toContain("worst headache of my life");

    const result = evaluateTriageState(state, null, emergencyCheck.isEmergency);
    expect(result.nextPhase).toBe("ready");
    expect(result.shouldRunAnalysis).toBe(true);
  });

  it("malformed marker fallback (Scenario 4)", () => {
    let state: TriageState = {
      phase: "gathering",
      collectedInfo: {},
      questionsAsked: 2,
      parseFailures: 0,
    };

    // First malformed JSON output from LLM
    let responseText = "READY_FOR_ANALYSIS { malformed json }";
    let result = evaluateTriageState(state, responseText, false);
    
    // Should fallback: ask one more question and stay in gathering phase
    expect(result.nextPhase).toBe("gathering");
    expect(result.nextQuestionsAsked).toBe(3);
    expect(result.nextParseFailures).toBe(1);
    expect(result.shouldRunAnalysis).toBe(false);
    expect(result.fallbackText).toBeDefined();

    // Update state for next turn
    state = {
      phase: result.nextPhase,
      collectedInfo: result.nextCollectedInfo,
      questionsAsked: result.nextQuestionsAsked,
      parseFailures: result.nextParseFailures,
    };

    // Second malformed JSON output from LLM
    responseText = "READY_FOR_ANALYSIS { still bad }";
    result = evaluateTriageState(state, responseText, false);

    // Should transition to ready after 2 failures
    expect(result.nextPhase).toBe("ready");
    expect(result.shouldRunAnalysis).toBe(true);
    expect(result.nextParseFailures).toBe(2);
  });

  it("hitting the question cap (Scenario 3)", () => {
    // 4 questions already asked
    const state: TriageState = {
      phase: "gathering",
      collectedInfo: {},
      questionsAsked: 4,
      parseFailures: 0,
    };

    // Should force transition to ready immediately
    const result = evaluateTriageState(state, "Another question...", false);
    expect(result.nextPhase).toBe("ready");
    expect(result.shouldRunAnalysis).toBe(true);
  });
});
