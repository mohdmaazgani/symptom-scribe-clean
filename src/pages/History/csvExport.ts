import { stripMarkdownFormatting } from "@/lib/symptom-consultation";

export interface HistoryEntryForExport {
  symptoms: string;
  severity_level: string;
  possible_causes: string[];
  recommendations: string[];
  risk_score: number;
  resolved: boolean;
  created_at: string;
}

const CSV_HEADERS = [
  "Date",
  "Symptoms",
  "Severity",
  "Risk Score",
  "Possible Causes",
  "Recommendations",
  "Resolved",
];

const csvField = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

const cleanText = (text: string) => {
  if (!text) return "";
  return stripMarkdownFormatting(text).replace(/\*/g, "");
};

export function buildHistoryCsv(history: HistoryEntryForExport[]): string {
  const rows = history.map((entry) => {
    const date = new Date(entry.created_at);
    // ISO 8601 (YYYY-MM-DD) is locale-independent, so Google Sheets/Excel
    // never mis-parse the day and month when auto-detecting the column type.
    const formattedDate = isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];

    const symptomsClean = cleanText(entry.symptoms);
    const severity = entry.severity_level || "";
    const riskScore =
      entry.risk_score !== undefined && entry.risk_score !== null ? entry.risk_score : "";

    const possibleCausesClean = entry.possible_causes
      ? entry.possible_causes.map((cause) => cleanText(cause)).join("; ")
      : "";

    const recommendationsClean = entry.recommendations
      ? entry.recommendations.map((rec) => cleanText(rec)).join("; ")
      : "";

    const resolved = entry.resolved ? "Yes" : "No";

    return [
      csvField(formattedDate),
      csvField(symptomsClean),
      csvField(severity),
      csvField(riskScore),
      csvField(possibleCausesClean),
      csvField(recommendationsClean),
      csvField(resolved),
    ];
  });

  return [CSV_HEADERS.map(csvField), ...rows].map((r) => r.join(",")).join("\n");
}
