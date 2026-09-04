import { describe, it, expect } from "vitest";
import { buildHistoryCsv, HistoryEntryForExport } from "../csvExport";

const baseEntry: HistoryEntryForExport = {
  symptoms: "Headache",
  severity_level: "low",
  possible_causes: ["Stress"],
  recommendations: ["Rest"],
  risk_score: 10,
  resolved: false,
  created_at: "2026-09-04T10:00:00.000Z",
};

describe("buildHistoryCsv", () => {
  it("formats dates as unambiguous ISO YYYY-MM-DD instead of a locale-dependent format", () => {
    // 2026-09-04 is ambiguous under DD/MM vs MM/DD (day <= 12): Google Sheets'
    // own locale can misread "04/09/2026" as 9 Apr instead of 4 Sep.
    const csv = buildHistoryCsv([baseEntry]);
    const dataRow = csv.split("\n")[1];

    expect(dataRow).toContain('"2026-09-04"');
    expect(dataRow).not.toContain("04/09/2026");
    expect(dataRow).not.toContain("09/04/2026");
  });

  it("quotes every field so commas and quotes inside values can't shift columns", () => {
    const entry: HistoryEntryForExport = {
      ...baseEntry,
      symptoms: 'Cough, "dry" type',
      possible_causes: ["Allergies, seasonal"],
    };

    const csv = buildHistoryCsv([entry]);
    const [headerLine, dataRow] = csv.split("\n");

    expect(headerLine).toBe(
      '"Date","Symptoms","Severity","Risk Score","Possible Causes","Recommendations","Resolved"'
    );
    // Embedded comma stays inside one quoted field instead of creating a new column.
    expect(dataRow).toContain('"Cough, ""dry"" type"');
    expect(dataRow.split(",")).toHaveLength(9); // 7 fields, but the two commas above are inside quotes
  });

  it("returns an empty date field for an invalid created_at instead of throwing", () => {
    const entry: HistoryEntryForExport = { ...baseEntry, created_at: "not-a-date" };
    const csv = buildHistoryCsv([entry]);
    const dataRow = csv.split("\n")[1];

    expect(dataRow.startsWith('"",')).toBe(true);
  });

  it("maps resolved and missing risk_score correctly", () => {
    const entry: HistoryEntryForExport = {
      ...baseEntry,
      resolved: true,
      risk_score: undefined as unknown as number,
    };
    const csv = buildHistoryCsv([entry]);
    const dataRow = csv.split("\n")[1];
    // No embedded quotes/commas in this entry, so the quoted fields can be
    // split on the `","` boundary directly.
    const fields = dataRow.slice(1, -1).split('","');

    expect(fields[3]).toBe(""); // Risk Score
    expect(fields[6]).toBe("Yes"); // Resolved
  });
});
