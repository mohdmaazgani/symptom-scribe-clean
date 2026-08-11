import { useState, useEffect } from "react";
import { Interaction } from "../components/InteractionAlerts";

export interface Drug {
  id: string;
  name: string;
  category: string;
}

const DRUG_DATABASE: Drug[] = [
  { id: "1", name: "Ibuprofen", category: "NSAID" },
  { id: "2", name: "Warfarin", category: "Anticoagulant" },
  { id: "3", name: "Aspirin", category: "NSAID / Antiplatelet" },
  { id: "4", name: "Lisinopril", category: "ACE Inhibitor" },
  { id: "5", name: "Spironolactone", category: "Diuretic" },
  { id: "6", name: "Metformin", category: "Antidiabetic" },
  { id: "7", name: "Sildenafil", category: "PDE5 Inhibitor" },
  { id: "8", name: "Nitroglycerin", category: "Vasodilator" },
  { id: "9", name: "Simvastatin", category: "Statin" },
  { id: "10", name: "Grapefruit Juice", category: "Dietary Item" },
  { id: "11", name: "Albuterol", category: "Bronchodilator" },
  { id: "12", name: "Propranolol", category: "Beta Blocker" },
  { id: "13", name: "Levothyroxine", category: "Thyroid Hormone" },
  { id: "14", name: "Calcium Carbonate", category: "Antacid" },
];

const INTERACTION_RULES = [
  {
    drugA: "Warfarin",
    drugB: "Aspirin",
    severity: "severe",
    mechanism: "Aspirin exerts antiplatelet action and damages GI mucosa, compounding Warfarin's anticoagulant effects, causing excessive bleeding hazards.",
    recommendation: "Avoid co-administration unless specifically directed by a cardiologist. Monitor INR levels frequently if essential.",
  },
  {
    drugA: "Warfarin",
    drugB: "Ibuprofen",
    severity: "severe",
    mechanism: "NSAIDs displace Warfarin from protein binding sites and compromise stomach lining, substantially raising bleeding hazards.",
    recommendation: "Use Acetaminophen (Paracetamol) instead of Ibuprofen for pain relief. Consult your physician.",
  },
  {
    drugA: "Lisinopril",
    drugB: "Spironolactone",
    severity: "moderate",
    mechanism: "Both medications promote potassium retention in the kidneys, which can precipitate hyperkalemia (high blood potassium levels), affecting cardiac rhythm.",
    recommendation: "Monitor serum potassium and creatinine levels within 1-2 weeks of starting combination therapy. Limit high-potassium foods.",
  },
  {
    drugA: "Sildenafil",
    drugB: "Nitroglycerin",
    severity: "severe",
    mechanism: "Co-administration of nitrates and PDE5 inhibitors induces synergistic nitric-oxide mediated vasodilation, prompting catastrophic, acute hypotension.",
    recommendation: "Strictly contraindicated. Do not take Sildenafil within 24 hours (or 48 hours for Tadalafil) of any nitrate usage.",
  },
  {
    drugA: "Simvastatin",
    drugB: "Grapefruit Juice",
    severity: "minor",
    mechanism: "Grapefruit juice inhibits CYP3A4 metabolism enzymes in the intestine, raising systemic levels of Simvastatin and increasing the risk of rhabdomyolysis.",
    recommendation: "Avoid consuming large amounts of grapefruit juice (>1 quart/day). Monitor for unexplained muscle aches or weakness.",
  },
];

export const useMedicationChecker = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [selectedMedications, setSelectedMedications] = useState<Drug[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered = DRUG_DATABASE.filter(
      (drug) =>
        drug.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !selectedMedications.some((selected) => selected.id === drug.id)
    );
    setSearchResults(filtered);
  }, [searchQuery, selectedMedications]);

  useEffect(() => {
    const list: Interaction[] = [];
    if (selectedMedications.length < 2) {
      setInteractions([]);
      return;
    }

    for (let i = 0; i < selectedMedications.length; i++) {
      for (let j = i + 1; j < selectedMedications.length; j++) {
        const drug1 = selectedMedications[i].name;
        const drug2 = selectedMedications[j].name;

        const foundRule = INTERACTION_RULES.find(
          (rule) =>
            (rule.drugA.toLowerCase() === drug1.toLowerCase() && rule.drugB.toLowerCase() === drug2.toLowerCase()) ||
            (rule.drugA.toLowerCase() === drug2.toLowerCase() && rule.drugB.toLowerCase() === drug1.toLowerCase())
        );

        if (foundRule) {
          list.push({
            id: `${selectedMedications[i].id}-\$\{selectedMedications[j].id}`,
            drugA: foundRule.drugA,
            drugB: foundRule.drugB,
            severity: foundRule.severity as any,
            mechanism: foundRule.mechanism,
            recommendation: foundRule.recommendation,
          });
        }
      }
    }
    setInteractions(list);
  }, [selectedMedications]);

  const handleAddMedication = (drug: Drug) => {
    setSelectedMedications((prev) => [...prev, drug]);
    setSearchQuery("");
  };

  const handleRemoveMedication = (id: string) => {
    setSelectedMedications((prev) => prev.filter((m) => m.id !== id));
  };

  const handleClearAll = () => {
    setSelectedMedications([]);
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    selectedMedications,
    interactions,
    handleAddMedication,
    handleRemoveMedication,
    handleClearAll,
  };
};

export default useMedicationChecker;