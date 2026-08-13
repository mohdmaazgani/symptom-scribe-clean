import { useState, useEffect, useCallback } from "react";

export type ReminderFrequency = "daily" | "weekly" | "custom";
export type ReminderDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface Reminder {
  id: string;
  label: string;
  frequency: ReminderFrequency;
  time: string; // HH:mm format
  days: ReminderDay[]; // For weekly/custom
  enabled: boolean;
  snoozeUntil?: string | null; // ISO timestamp
  createdAt: string;
  updatedAt: string;
}

export interface ReminderHistoryEntry {
  id: string;
  reminderId: string;
  reminderLabel: string;
  firedAt: string; // ISO timestamp
  action: "fired" | "snoozed" | "dismissed";
  snoozeMinutes?: number;
}

const REMINDERS_KEY = "symptom_scribe_reminders";
const REMINDER_HISTORY_KEY = "symptom_scribe_reminder_history";

function generateId(): string {
  return `reminder_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>(() =>
    loadFromStorage<Reminder[]>(REMINDERS_KEY, [])
  );
  const [history, setHistory] = useState<ReminderHistoryEntry[]>(() =>
    loadFromStorage<ReminderHistoryEntry[]>(REMINDER_HISTORY_KEY, [])
  );

  // Persist reminders on change
  useEffect(() => {
    saveToStorage(REMINDERS_KEY, reminders);
  }, [reminders]);

  // Persist history on change
  useEffect(() => {
    saveToStorage(REMINDER_HISTORY_KEY, history);
  }, [history]);

  const addReminder = useCallback(
    (
      data: Omit<Reminder, "id" | "createdAt" | "updatedAt" | "snoozeUntil">
    ): Reminder => {
      const now = new Date().toISOString();
      const reminder: Reminder = {
        ...data,
        id: generateId(),
        snoozeUntil: null,
        createdAt: now,
        updatedAt: now,
      };
      setReminders((prev) => [...prev, reminder]);
      return reminder;
    },
    []
  );

  const updateReminder = useCallback(
    (id: string, updates: Partial<Omit<Reminder, "id" | "createdAt">>): void => {
      setReminders((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, ...updates, updatedAt: new Date().toISOString() }
            : r
        )
      );
    },
    []
  );

  const deleteReminder = useCallback((id: string): void => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleReminder = useCallback((id: string): void => {
    setReminders((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, enabled: !r.enabled, updatedAt: new Date().toISOString() }
          : r
      )
    );
  }, []);

  const snoozeReminder = useCallback(
    (id: string, minutes: number): void => {
      const snoozeUntil = new Date(
        Date.now() + minutes * 60 * 1000
      ).toISOString();
      setReminders((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, snoozeUntil, updatedAt: new Date().toISOString() }
            : r
        )
      );
      const reminder = reminders.find((r) => r.id === id);
      if (reminder) {
        const entry: ReminderHistoryEntry = {
          id: generateId(),
          reminderId: id,
          reminderLabel: reminder.label,
          firedAt: new Date().toISOString(),
          action: "snoozed",
          snoozeMinutes: minutes,
        };
        setHistory((prev) => [entry, ...prev].slice(0, 100));
      }
    },
    [reminders]
  );

  const dismissReminder = useCallback(
    (id: string): void => {
      setReminders((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, snoozeUntil: null, updatedAt: new Date().toISOString() }
            : r
        )
      );
      const reminder = reminders.find((r) => r.id === id);
      if (reminder) {
        const entry: ReminderHistoryEntry = {
          id: generateId(),
          reminderId: id,
          reminderLabel: reminder.label,
          firedAt: new Date().toISOString(),
          action: "dismissed",
        };
        setHistory((prev) => [entry, ...prev].slice(0, 100));
      }
    },
    [reminders]
  );

  const clearHistory = useCallback((): void => {
    setHistory([]);
  }, []);

  const isActiveNow = useCallback(
    (reminder: Reminder): boolean => {
      if (!reminder.enabled) return false;
      if (
        reminder.snoozeUntil &&
        new Date(reminder.snoozeUntil) > new Date()
      ) {
        return false;
      }
      return true;
    },
    []
  );

  return {
    reminders,
    history,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
    snoozeReminder,
    dismissReminder,
    clearHistory,
    isActiveNow,
  };
}
