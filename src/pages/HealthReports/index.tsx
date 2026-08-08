import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Download, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ReportCharts from "./components/ReportCharts";
import { generatePDF } from "./utils/pdfGenerator";

const HealthReports: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("30");
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeSymptoms, setIncludeSymptoms] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    toast({
      title: "Compiling Report",
      description: "Aggregating clinical history and generating graphs. Please wait...",
    });

    try {
      const success = await generatePDF({
        days: parseInt(dateRange, 10),
        includeMetrics,
        includeSymptoms,
      });

      if (success) {
        toast({
          title: "Report Exported",
          description: "Your health status PDF report was successfully compiled and downloaded.",
        });
      } else {
        throw new Error("PDF compilation failed");
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "An error occurred during PDF assembly. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileText className="h-8 w-8 text-emerald-500" />
          {t("sidebar.items.healthReports", "Diagnostic Report Center")}
        </h1>
        <p className="text-muted-foreground mt-1">
          Export clinical-grade summaries of your health metrics and symptoms history for consultations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Settings</CardTitle>
              <CardDescription>Configure scope and details to include in the generated PDF.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block">
                  Date Range Scope
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "7", label: "7 Days" },
                    { val: "30", label: "30 Days" },
                    { val: "90", label: "90 Days" },
                  ].map((opt) => (
                    <Button
                      key={opt.val}
                      type="button"
                      variant={dateRange === opt.val ? "default" : "outline"}
                      onClick={() => setDateRange(opt.val)}
                      className="w-full text-xs"
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block">
                  Report Sections
                </label>

                <div
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => setIncludeSymptoms(!includeSymptoms)}
                >
                  <div>
                    <span className="text-sm font-medium">Symptom Diary</span>
                    <p className="text-xs text-muted-foreground">List recent symptom records and logs.</p>
                  </div>
                  <Badge variant={includeSymptoms ? "default" : "outline"}>
                    {includeSymptoms ? "Enabled" : "Disabled"}
                  </Badge>
                </div>

                <div
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => setIncludeMetrics(!includeMetrics)}
                >
                  <div>
                    <span className="text-sm font-medium">Vital Signs & Trends</span>
                    <p className="text-xs text-muted-foreground">Detailed blood pressure, sleep, glucose plots.</p>
                  </div>
                  <Badge variant={includeMetrics ? "default" : "outline"}>
                    {includeMetrics ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/10 p-4">
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating || (!includeMetrics && !includeSymptoms)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Assembling Report...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download PDF Report
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Interactive History Preview</span>
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                  {dateRange} Days Period
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div id="report-visual-preview" className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Active Health Summary</h3>
                  <p className="text-xs text-muted-foreground">Aggregated trends based on dummy records.</p>
                </div>

                <ReportCharts days={parseInt(dateRange, 10)} includeMetrics={includeMetrics} />

                {includeSymptoms && (
                  <div className="space-y-3 border-t pt-6">
                    <h4 className="font-semibold text-sm">Recent Logged Conditions</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded-lg text-sm">
                        <span className="font-medium text-foreground">Migraine / Head Pressure</span>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground text-xs">Aug 05, 2026</span>
                          <Badge className="bg-amber-500 text-white">Moderate (4/10)</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg text-sm">
                        <span className="font-medium text-foreground">Heartburn / Gastro</span>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground text-xs">Aug 01, 2026</span>
                          <Badge className="bg-yellow-500 text-dark">Mild (2/10)</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HealthReports;