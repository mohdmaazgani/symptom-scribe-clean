export interface ParsedSymptomConsultation {
  possibleCauses: string[];
  recommendations: string[];
  severityLevel: "low" | "moderate" | "high";
}

/**
 * Strips markdown bold (`**text**`) and italic (`*text*`) markers from a string.
 *
 * Handles:
 * - Basic bold: **text** → text
 * - Basic italic: *text* → text
 * - Multiple markers: **A** and **B** → A and B
 * - Nested markers: ***text*** → text (via iterative stripping)
 * - Whitespace: **  text  ** → text (trimmed)
 *
 * Does NOT handle:
 * - Underscore variants (_text_)
 * - Other markdown (links, code blocks, etc.)
 *
 * @param text - The string to process
 * @returns Cleaned string with markdown markers removed, or empty string if input is invalid
 */
export function stripMarkdownFormatting(text: string): string {
  // Defensive input validation
  if (!text || typeof text !== "string") {
    return "";
  }

  // Prevent ReDoS: Cap input length
  const MAX_LENGTH = 10000;
  if (text.length > MAX_LENGTH) {
    console.warn(`stripMarkdownFormatting: Input exceeds max length (${text.length}). Truncating.`);
    text = text.slice(0, MAX_LENGTH);
  }

  let result = text;
  let previousResult = "";
  let iterations = 0;
  const MAX_ITERATIONS = 10; // Prevent infinite loops with malformed input

  // Iteratively strip markers to handle nested/malformed patterns
  while (result !== previousResult && iterations < MAX_ITERATIONS) {
    previousResult = result;
    // Strip bold (**text**), capturing content and trimming whitespace
    result = result.replace(/\*\*\s*(.+?)\s*\*\*/g, "$1");
    // Strip italic (*text*), using negative lookahead to avoid ** matches
    result = result.replace(/(?<!\*)\*\s*(.+?)\s*\*(?!\*)/g, "$1");
    iterations++;
  }

  return result.trim();
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

    // Strip markdown at parse time to ensure new records are clean
    // Also apply at render time for backward compatibility with existing records
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
