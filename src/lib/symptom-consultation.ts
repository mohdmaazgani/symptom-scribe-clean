export interface ParsedSymptomConsultation {
  possibleCauses: string[];
  recommendations: string[];
  severityLevel: "low" | "moderate" | "high";
}

/**
 * Strips markdown bold (`**text**`) and italic (`*text*`) markers from a string.
 * This prevents raw `**` from appearing as literal characters in the UI when
 * the AI model returns markdown-formatted text in structured fields.
 */
export function stripMarkdownFormatting(text: string): string {
  // First strip bold (**text**), then italic (*text*)
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
}

export function parseSymptomConsultation(assistantContent: string): ParsedSymptomConsultation {
  const possibleCauses: string[] = [];
  const recommendations: string[] = [];
  let severityLevel: ParsedSymptomConsultation["severityLevel"] = "low";
  let currentSection = "";

  for (const line of assistantContent.split("\n")) {
    const trimmedLine = line.trim();

    if (!trimmedLine) continue;

    if (/possible\s+causes?/i.test(trimmedLine)) {
      currentSection = "causes";
      continue;
    }

    if (/severity(\s+level)?/i.test(trimmedLine)) {
      currentSection = "severity";
      const severityMatch = trimmedLine.match(
        /severity(?:\s+level)?\s*:\s*[*_#`[]*\s*(low|moderate|high)/i
      );
      if (severityMatch) {
        severityLevel =
          severityMatch[1].toLowerCase() as ParsedSymptomConsultation["severityLevel"];
      }
      continue;
    }

    if (/recommendations?/i.test(trimmedLine)) {
      currentSection = "recommendations";
      continue;
    }

    const listMatch = trimmedLine.match(/^[-*•]\s+(.+)/) || trimmedLine.match(/^\d+\.\s+(.+)/);

    if (!listMatch) continue;

    const item = stripMarkdownFormatting(listMatch[1].trim());
    if (!item) continue;

    if (currentSection === "causes") {
      possibleCauses.push(item);
    } else if (currentSection === "recommendations") {
      recommendations.push(item);
    }
  }

  return { possibleCauses, recommendations, severityLevel };
}

export function computeRiskScore(
  severityLevel: ParsedSymptomConsultation["severityLevel"],
  possibleCauseCount: number,
  recommendationCount: number
): number {
  const causeWeight = possibleCauseCount * 2;
  const recommendationPenalty = recommendationCount === 0 ? 4 : 0;

  if (severityLevel === "high") {
    return Math.min(100, Math.max(70, 75 + causeWeight - recommendationPenalty));
  }

  if (severityLevel === "moderate") {
    return Math.min(69, Math.max(40, 50 + causeWeight - recommendationPenalty));
  }

  return Math.min(39, Math.max(10, 20 + causeWeight - recommendationPenalty));
}

export function shouldPersistConsultation(assistantContent: string): boolean {
  return assistantContent.trim().length > 0;
}
