import { useState } from "react";

export interface VaccinationEntry {
  id: string;
  vaccineName: string;
  dateAdministered: string;
  doseNumber: string;
  nextDueDate: string;
  provider: string;
}

export const useVaccinationLog = () => {
  const [vaccineName, setVaccineName] = useState("");
  const [dateAdministered, setDateAdministered] = useState("");
  const [doseNumber, setDoseNumber] = useState("1");
  const [nextDueDate, setNextDueDate] = useState("");
  const [provider, setProvider] = useState("");
  const [entries, setEntries] = useState<VaccinationEntry[]>([]);

  const addEntry = () => {
    if (!vaccineName || !dateAdministered) return;
    setEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), vaccineName, dateAdministered, doseNumber, nextDueDate, provider },
    ]);
    setVaccineName("");
    setDateAdministered("");
    setDoseNumber("1");
    setNextDueDate("");
    setProvider("");
  };

  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  return {
    vaccineName, setVaccineName, dateAdministered, setDateAdministered,
    doseNumber, setDoseNumber, nextDueDate, setNextDueDate,
    provider, setProvider, entries, addEntry, removeEntry,
  };
};

export default useVaccinationLog;
