import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pill, Search, AlertTriangle, ShieldCheck, RefreshCw, Plus, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import InteractionAlerts from "./components/InteractionAlerts";
import useMedicationChecker from "./hooks/useMedicationChecker";

const MedicationChecker: React.FC = () => {
  const { t } = useTranslation();
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    selectedMedications,
    interactions,
    handleAddMedication,
    handleRemoveMedication,
    handleClearAll,
  } = useMedicationChecker();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Pill className="h-8 w-8 text-cyan-500" />
            {t("sidebar.items.medicationChecker", "Medication Interaction Checker")}
          </h1>
          <p className="text-muted-foreground mt-1">
            Check potential drug-to-drug interactions instantly. Ensure your safety before combining medications.
          </p>
        </div>
        {selectedMedications.length > 0 && (
          <Button variant="outline" onClick={handleClearAll} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Clear Checked List
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-cyan-500/10 bg-slate-900/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Search Medications</CardTitle>
              <CardDescription>Search and select medications to analyze interactions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. Ibuprofen, Warfarin, Aspirin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background/50"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="border rounded-md divide-y max-h-[220px] overflow-y-auto bg-background/80 shadow-inner">
                  {searchResults.map((drug) => (
                    <div
                      key={drug.id}
                      className="p-3 flex items-center justify-between hover:bg-cyan-500/5 cursor-pointer transition-colors"
                      onClick={() => handleAddMedication(drug)}
                    >
                      <div>
                        <span className="font-medium text-sm text-foreground">{drug.name}</span>
                        <p className="text-xs text-muted-foreground uppercase">{drug.category}</p>
                      </div>
                      <Plus className="h-4 w-4 text-cyan-500" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Selected List</span>
                <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20">
                  {selectedMedications.length} Added
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMedications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground flex flex-col items-center justify-center space-y-2 border border-dashed rounded-lg">
                  <Pill className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm">Search and add drugs above to begin checking interactions.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedMedications.map((med) => (
                    <div
                      key={med.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-background hover:border-cyan-500/20 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-cyan-500" />
                        <div>
                          <span className="font-medium text-sm">{med.name}</span>
                          <span className="text-xs block text-muted-foreground">{med.category}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMedication(med.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="min-h-[400px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">Analysis Results</CardTitle>
              <CardDescription>
                Potential cross-interactions found between selected substances based on clinical datasets.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              {selectedMedications.length < 2 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 space-y-4">
                  <ShieldCheck className="h-16 w-16 text-cyan-500/30 animate-pulse" />
                  <div>
                    <h3 className="font-semibold text-lg">Awaiting Analysis</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
                      Add at least two medications to run the interaction checking engine.
                    </p>
                  </div>
                </div>
              ) : (
                <InteractionAlerts interactions={interactions} medications={selectedMedications} />
              )}
            </CardContent>
            <CardFooter className="border-t bg-muted/20 text-xs text-muted-foreground p-4 flex gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-cyan-500" />
              <span>
                Disclaimer: This tool is for informational purposes only. Do not stop or alter prescribed medications without consulting your physician.
              </span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MedicationChecker;