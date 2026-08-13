import { describe, expect, it } from "vitest";
import {
  computeRiskScore,
  parseSymptomConsultation,
  shouldPersistConsultation,
  stripMarkdownFormatting,
} from "@/lib/symptom-consultation";

describe("symptom consultation helpers", () => {
  it("parses consultation sections without relying on exact heading casing", () => {
    const parsed = parseSymptomConsultation(`
possible causes
- Viral infection
- Dehydration

severity: Moderate

RECOMMENDATIONS
1. Rest
2. Increase fluids
`);

    expect(parsed.possibleCauses).toEqual(["Viral infection", "Dehydration"]);
    expect(parsed.recommendations).toEqual(["Rest", "Increase fluids"]);
    expect(parsed.severityLevel).toBe("moderate");
  });

  it("strips markdown bold markers from parsed causes and recommendations", () => {
    const parsed = parseSymptomConsultation(`
### Possible Causes
- **Viral Infections:** Common cold, flu, COVID-19, or other viral illnesses
- **Bacterial Infections:** Conditions like strep throat or UTIs
- **Inflammation:** The body's response to inflammation

### Recommendations
- **Monitor Temperature:** Keep track of your temperature
- **Rest:** Get plenty of rest to help your body recover
- **Stay Hydrated:** Drink plenty of fluids
`);

    expect(parsed.possibleCauses).toEqual([
      "Viral Infections: Common cold, flu, COVID-19, or other viral illnesses",
      "Bacterial Infections: Conditions like strep throat or UTIs",
      "Inflammation: The body's response to inflammation",
    ]);
    expect(parsed.recommendations).toEqual([
      "Monitor Temperature: Keep track of your temperature",
      "Rest: Get plenty of rest to help your body recover",
      "Stay Hydrated: Drink plenty of fluids",
    ]);
  });

  it("persists completed consultations even when the AI response format varies", () => {
    expect(shouldPersistConsultation("Likely a mild viral illness. Please rest and hydrate.")).toBe(
      true
    );
    expect(shouldPersistConsultation("   ")).toBe(false);
  });

  it("keeps computed risk scores within the expected severity bands", () => {
    expect(computeRiskScore("high", 2, 1)).toBeGreaterThanOrEqual(70);
    expect(computeRiskScore("moderate", 1, 1)).toBeGreaterThanOrEqual(40);
    expect(computeRiskScore("moderate", 1, 1)).toBeLessThanOrEqual(69);
    expect(computeRiskScore("low", 0, 0)).toBeLessThanOrEqual(39);
  });
});

describe("stripMarkdownFormatting", () => {
  it("strips bold markers (**text**)", () => {
    expect(stripMarkdownFormatting("**Viral Infections:** Common cold")).toBe(
      "Viral Infections: Common cold"
    );
  });

  it("strips italic markers (*text*)", () => {
    expect(stripMarkdownFormatting("*Important* note")).toBe("Important note");
  });

  it("strips multiple bold markers in the same string", () => {
    expect(stripMarkdownFormatting("**A** and **B** together")).toBe("A and B together");
  });

  it("strips nested/repeated markers (***text***)", () => {
    expect(stripMarkdownFormatting("***Important***")).toBe("Important");
    expect(stripMarkdownFormatting("****Bold Bold****")).toBe("Bold Bold");
  });

  it("handles whitespace around markers", () => {
    expect(stripMarkdownFormatting("**  spaced  **")).toBe("spaced");
    expect(stripMarkdownFormatting("*  italic  *")).toBe("italic");
  });

  it("returns plain text unchanged", () => {
    expect(stripMarkdownFormatting("No markdown here")).toBe("No markdown here");
  });

  it("handles empty string", () => {
    expect(stripMarkdownFormatting("")).toBe("");
  });

  it("handles whitespace-only string", () => {
    expect(stripMarkdownFormatting("   ")).toBe("");
  });

  it("handles invalid input gracefully", () => {
    expect(stripMarkdownFormatting(null as unknown as string)).toBe("");
    expect(stripMarkdownFormatting(undefined as unknown as string)).toBe("");
  });

  it("handles malformed/unclosed markers gracefully", () => {
    // Unclosed markers are left as-is (expected behavior)
    expect(stripMarkdownFormatting("**unclosed")).toBe("**unclosed");
    expect(stripMarkdownFormatting("*unclosed")).toBe("*unclosed");
  });

  it("handles mixed bold and italic", () => {
    expect(stripMarkdownFormatting("**bold** and *italic*")).toBe("bold and italic");
    expect(stripMarkdownFormatting("***bold italic***")).toBe("bold italic");
  });
});
