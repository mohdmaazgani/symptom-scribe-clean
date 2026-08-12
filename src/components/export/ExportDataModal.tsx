import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/lib/toast-helpers";
import { whenEncryptionReady, decryptProfileField, decryptProfileArray } from "@/lib/encryption";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Table, Loader2, Calendar, ShieldCheck } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportDataModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ExportDataModal({ trigger, open: controlledOpen, onOpenChange }: ExportDataModalProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  const [format, setFormat] = useState<"pdf" | "csv">("pdf");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [includeSymptoms, setIncludeSymptoms] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeProfile, setIncludeProfile] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    const selectedTypes: string[] = [];
    if (includeProfile) selectedTypes.push("profile");
    if (includeSymptoms) selectedTypes.push("symptoms");
    if (includeMetrics) selectedTypes.push("metrics");

    if (selectedTypes.length === 0) {
      showError(
        t("exportData.errors.noTypeSelectedTitle", "No Data Selected"),
        t("exportData.errors.noTypeSelectedDesc", "Please select at least one data category to export.")
      );
      return;
    }

    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication required");

      // Attempt Edge Function invoke first
      let downloaded = false;
      try {
        const { data, error } = await supabase.functions.invoke("export-user-data", {
          body: {
            format,
            date_range: dateRange,
            data_types: selectedTypes,
          },
        });

        if (!error && data) {
          // If returned as Blob or ArrayBuffer
          const blob = data instanceof Blob ? data : new Blob([data], { type: format === "pdf" ? "application/pdf" : "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `health_data_export_${new Date().toISOString().slice(0, 10)}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          downloaded = true;
        }
      } catch (edgeErr) {
        console.warn("Edge function export fallback to client generator:", edgeErr);
      }

      // Client-side fallback generator if Edge Function wasn't invoked
      if (!downloaded) {
        await generateClientSideExport(session.user.id, format, dateRange, selectedTypes);
      }

      showSuccess(
        t("exportData.successTitle", "Export Complete!"),
        t("exportData.successDesc", `Your health data report has been generated in ${format.toUpperCase()} format.`)
      );
      setOpen(false);
    } catch (err: unknown) {
      const error = err as Error;
      showError(
        t("exportData.errors.exportFailedTitle", "Export Failed"),
        error.message || t("exportData.errors.exportFailedDesc", "Could not generate export file.")
      );
    } finally {
      setExporting(false);
    }
  };

interface ExportProfile {
  full_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  blood_type?: string | null;
  allergies?: string[] | null;
  chronic_conditions?: string[] | null;
}

interface ExportSymptom {
  created_at?: string | null;
  symptoms?: string | null;
  severity_level?: string | null;
  risk_score?: number | null;
  ai_analysis?: string | null;
}

interface ExportMetric {
  recorded_at?: string | null;
  metric_type?: string;
  value?: unknown;
  notes?: string | null;
}

  const generateClientSideExport = async (
    userId: string,
    exportFormat: "pdf" | "csv",
    range: "7d" | "30d" | "90d" | "all",
    types: string[]
  ) => {
    let cutoffDate: Date | null = null;
    const now = new Date();
    if (range === "7d") cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (range === "30d") cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (range === "90d") cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Fetch Profile
    let profileData: ExportProfile | null = null;
    if (types.includes("profile")) {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
      if (data) {
        try {
          const key = await whenEncryptionReady();
          const fullName = await decryptProfileField(data.full_name, key);
          const dob = await decryptProfileField(data.date_of_birth, key);
          const allergies = await decryptProfileArray(data.allergies, key);
          const chronic = await decryptProfileArray(data.chronic_conditions, key);
          profileData = { ...data, full_name: fullName, date_of_birth: dob, allergies, chronic_conditions: chronic };
        } catch {
          profileData = data;
        }
      }
    }

    // Fetch Symptoms
    let symptoms: ExportSymptom[] = [];
    if (types.includes("symptoms")) {
      let query = supabase.from("symptom_history").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (cutoffDate) query = query.gte("created_at", cutoffDate.toISOString());
      const { data } = await query;
      symptoms = (data || []) as ExportSymptom[];
    }

    // Fetch Metrics
    let metrics: ExportMetric[] = [];
    if (types.includes("metrics")) {
      let query = supabase.from("health_metrics").select("*").eq("user_id", userId).order("recorded_at", { ascending: false });
      if (cutoffDate) query = query.gte("recorded_at", cutoffDate.toISOString());
      const { data } = await query;
      metrics = (data || []) as ExportMetric[];
    }

    const timestampStr = new Date().toISOString().slice(0, 10);

    if (exportFormat === "csv") {
      let csv = "=== SYMPTOM SCRIBE - HEALTH DATA REPORT ===\n";
      csv += `Export Date,${new Date().toLocaleString()}\n`;
      if (profileData) {
        csv += `Patient Name,"${profileData.full_name || "N/A"}"\n`;
        csv += `Gender,${profileData.gender || "N/A"}\n`;
        csv += `Blood Type,${profileData.blood_type || "N/A"}\n`;
      }
      csv += "\n";

      if (types.includes("symptoms")) {
        csv += "=== SYMPTOM HISTORY ===\n";
        csv += "Date,Symptoms,Severity,Risk Score,AI Analysis\n";
        symptoms.forEach((s) => {
          const dateStr = s.created_at ? new Date(s.created_at).toLocaleDateString() : "";
          csv += `"${dateStr}","${(s.symptoms || "").replace(/"/g, '""')}","${s.severity_level || "low"}","${s.risk_score || 0}","${(s.ai_analysis || "").replace(/"/g, '""')}"\n`;
        });
        csv += "\n";
      }

      if (types.includes("metrics")) {
        csv += "=== HEALTH METRICS ===\n";
        csv += "Date,Metric Type,Value,Notes\n";
        metrics.forEach((m) => {
          const dateStr = m.recorded_at ? new Date(m.recorded_at).toLocaleDateString() : "";
          const valStr = typeof m.value === "object" ? JSON.stringify(m.value) : String(m.value);
          csv += `"${dateStr}","${m.metric_type || "N/A"}","${valStr.replace(/"/g, '""')}","${(m.notes || "").replace(/"/g, '""')}"\n`;
        });
      }

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `health_data_${timestampStr}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // PDF via jsPDF & autoTable
      const doc = new jsPDF();

      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 25, "F");

      doc.setTextColor(56, 189, 248); // cyan-400
      doc.setFontSize(16);
      doc.text("Symptom Scribe — Health Data Export", 14, 16);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 16);

      let startY = 35;

      if (profileData) {
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(12);
        doc.text("Patient Summary", 14, startY);
        startY += 6;

        autoTable(doc, {
          startY,
          head: [["Field", "Details"]],
          body: [
            ["Name", profileData.full_name || "N/A"],
            ["Gender", profileData.gender || "N/A"],
            ["Blood Type", profileData.blood_type || "N/A"],
            ["Allergies", (profileData.allergies || []).join(", ") || "None recorded"],
            ["Chronic Conditions", (profileData.chronic_conditions || []).join(", ") || "None recorded"],
          ],
          theme: "striped",
          headStyles: { fillColor: [14, 116, 144] },
        });

        startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
      }

      if (types.includes("symptoms") && symptoms.length > 0) {
        doc.setFontSize(12);
        doc.text("Symptom Consultation History", 14, startY);
        startY += 6;

        const tableRows = symptoms.map((s) => [
          s.created_at ? new Date(s.created_at).toLocaleDateString() : "N/A",
          (s.symptoms || "").slice(0, 40) + "...",
          s.severity_level || "low",
          `${s.risk_score || 0}/100`,
        ]);

        autoTable(doc, {
          startY,
          head: [["Date", "Symptoms", "Severity", "Risk Score"]],
          body: tableRows,
          theme: "striped",
          headStyles: { fillColor: [30, 41, 59] },
        });

        startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
      }

      if (types.includes("metrics") && metrics.length > 0) {
        doc.setFontSize(12);
        doc.text("Vitals & Health Metrics", 14, startY);
        startY += 6;

        const metricRows = metrics.map((m) => [
          m.recorded_at ? new Date(m.recorded_at).toLocaleDateString() : "N/A",
          m.metric_type || "N/A",
          typeof m.value === "object" ? JSON.stringify(m.value) : String(m.value),
          m.notes || "—",
        ]);

        autoTable(doc, {
          startY,
          head: [["Date", "Metric", "Value", "Notes"]],
          body: metricRows,
          theme: "striped",
          headStyles: { fillColor: [14, 116, 144] },
        });
      }

      doc.save(`health_data_${timestampStr}.pdf`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            {t("exportData.title", "Export Health Data")}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t(
              "exportData.description",
              "Generate a downloadable PDF or CSV health report for data portability or sharing with your doctor."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Format Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("exportData.formatLabel", "Export Format")}
            </Label>
            <RadioGroup
              value={format}
              onValueChange={(val) => setFormat(val as "pdf" | "csv")}
              className="grid grid-cols-2 gap-3"
            >
              <div>
                <RadioGroupItem value="pdf" id="format-pdf" className="peer sr-only" />
                <Label
                  htmlFor="format-pdf"
                  className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-cyan-400 [&:has([data-state=checked])]:border-cyan-400 cursor-pointer"
                >
                  <FileText className="w-6 h-6 mb-1 text-cyan-400" />
                  <span className="text-xs font-semibold">{t("exportData.pdfFormat", "PDF Summary Report")}</span>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="csv" id="format-csv" className="peer sr-only" />
                <Label
                  htmlFor="format-csv"
                  className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-cyan-400 [&:has([data-state=checked])]:border-cyan-400 cursor-pointer"
                >
                  <Table className="w-6 h-6 mb-1 text-emerald-400" />
                  <span className="text-xs font-semibold">{t("exportData.csvFormat", "Raw CSV Data")}</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Timeframe Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              {t("exportData.timeframeLabel", "Timeframe / Date Range")}
            </Label>
            <Select value={dateRange} onValueChange={(val) => setDateRange(val as "7d" | "30d" | "90d" | "all")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("exportData.selectTimeframe", "Select timeframe")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">{t("exportData.ranges.7d", "Last 7 Days")}</SelectItem>
                <SelectItem value="30d">{t("exportData.ranges.30d", "Last 30 Days")}</SelectItem>
                <SelectItem value="90d">{t("exportData.ranges.90d", "Last 90 Days")}</SelectItem>
                <SelectItem value="all">{t("exportData.ranges.all", "All Time (Complete History)")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Categories Checklist */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("exportData.categoriesLabel", "Include Data Categories")}
            </Label>
            <div className="space-y-2.5 p-3 rounded-xl bg-card border border-border">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-symptoms"
                  checked={includeSymptoms}
                  onCheckedChange={(checked) => setIncludeSymptoms(!!checked)}
                />
                <Label htmlFor="include-symptoms" className="text-xs cursor-pointer">
                  {t("exportData.categories.symptoms", "Symptom Consultations & AI History")}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-metrics"
                  checked={includeMetrics}
                  onCheckedChange={(checked) => setIncludeMetrics(!!checked)}
                />
                <Label htmlFor="include-metrics" className="text-xs cursor-pointer">
                  {t("exportData.categories.metrics", "Vitals & Health Metrics")}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-profile"
                  checked={includeProfile}
                  onCheckedChange={(checked) => setIncludeProfile(!!checked)}
                />
                <Label htmlFor="include-profile" className="text-xs cursor-pointer">
                  {t("exportData.categories.profile", "Medical Profile (Allergies, Chronic Conditions)")}
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-cyan-950/20 p-2.5 rounded-lg border border-cyan-500/20">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{t("exportData.privacyNotice", "Your data export is generated securely with client-side encryption support.")}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={exporting}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button size="sm" onClick={handleExport} disabled={exporting} className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-medium">
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                {t("exportData.generating", "Generating Report...")}
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-1.5" />
                {t("exportData.downloadButton", "Download Report")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
