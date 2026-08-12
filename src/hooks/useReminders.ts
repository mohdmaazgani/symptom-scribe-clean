import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `reminder_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
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

  // Fetch reminders and history from Supabase when user is authenticated
  useEffect(() => {
    let isMounted = true;
    const fetchAccountReminders = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;

        const { data: dbReminders } = await supabase
          .from("user_reminders")
          .select("*")
          .eq("user_id", session.user.id);

        if (dbReminders && isMounted) {
          const mapped: Reminder[] = dbReminders.map((r) => ({
            id: r.id,
            label: r.label,
            frequency: (r.frequency as ReminderFrequency) || "daily",
            time: r.time,
            days: (r.days as ReminderDay[]) || [],
            enabled: r.enabled,
            snoozeUntil: r.snooze_until,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }));
          setReminders(mapped);
          saveToStorage(REMINDERS_KEY, mapped);
        }

        const { data: dbHistory } = await supabase
          .from("user_reminder_history")
          .select("*")
          .eq("user_id", session.user.id)
          .order("fired_at", { ascending: false })
          .limit(100);

        if (dbHistory && isMounted) {
          const mappedHistory: ReminderHistoryEntry[] = dbHistory.map((h) => ({
            id: h.id,
            reminderId: h.reminder_id || "",
            reminderLabel: h.reminder_label,
            firedAt: h.fired_at,
            action: (h.action as "fired" | "snoozed" | "dismissed") || "fired",
            snoozeMinutes: h.snooze_minutes || undefined,
          }));
          setHistory(mappedHistory);
          saveToStorage(REMINDER_HISTORY_KEY, mappedHistory);
        }
      } catch (err) {
        console.warn("Failed to fetch reminders from account:", err);
      }
    };

    fetchAccountReminders();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        fetchAccountReminders();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Persist reminders to localStorage
  useEffect(() => {
    saveToStorage(REMINDERS_KEY, reminders);
  }, [reminders]);

  // Persist history to localStorage
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

      // Sync to Supabase
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user?.id) return;
        supabase.from("user_reminders").insert({
          id: reminder.id,
          user_id: session.user.id,
          label: reminder.label,
          frequency: reminder.frequency,
          time: reminder.time,
          days: reminder.days,
          enabled: reminder.enabled,
          snooze_until: reminder.snoozeUntil,
          created_at: reminder.createdAt,
          updated_at: reminder.updatedAt,
        }).catch((err) => console.warn("Failed to insert reminder to Supabase:", err));
      });

      return reminder;
    },
    []
  );

  const updateReminder = useCallback(
    (id: string, updates: Partial<Omit<Reminder, "id" | "createdAt">>): void => {
      const now = new Date().toISOString();
      setReminders((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, ...updates, updatedAt: now } : r
        )
      );

      // Sync to Supabase
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user?.id) return;
        const payload: Record<string, unknown> = { updated_at: now };
        if (updates.label !== undefined) payload.label = updates.label;
        if (updates.frequency !== undefined) payload.frequency = updates.frequency;
        if (updates.time !== undefined) payload.time = updates.time;
        if (updates.days !== undefined) payload.days = updates.days;
        if (updates.enabled !== undefined) payload.enabled = updates.enabled;
        if (updates.snoozeUntil !== undefined) payload.snooze_until = updates.snoozeUntil;

        supabase.from("user_reminders").update(payload).eq("id", id).catch((err) =>
          console.warn("Failed to update reminder in Supabase:", err)
        );
      });
    },
    []
  );

  const deleteReminder = useCallback((id: string): void => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.id) return;
      supabase.from("user_reminders").delete().eq("id", id).catch((err) =>
        console.warn("Failed to delete reminder from Supabase:", err)
      );
    });
  }, []);

  const toggleReminder = useCallback((id: string): void => {
    let nextEnabled = false;
    const now = new Date().toISOString();
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          nextEnabled = !r.enabled;
          return { ...r, enabled: nextEnabled, updatedAt: now };
        }
        return r;
      })
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.id) return;
      supabase.from("user_reminders").update({ enabled: nextEnabled, updated_at: now }).eq("id", id).catch((err) =>
        console.warn("Failed to toggle reminder in Supabase:", err)
      );
    });
  }, []);

  const snoozeReminder = useCallback(
    (id: string, minutes: number): void => {
      const snoozeUntil = new Date(
        Date.now() + minutes * 60 * 1000
      ).toISOString();
      const now = new Date().toISOString();
      setReminders((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, snoozeUntil, updatedAt: now } : r
        )
      );

      const reminder = reminders.find((r) => r.id === id);
      if (reminder) {
        const entry: ReminderHistoryEntry = {
          id: generateId(),
          reminderId: id,
          reminderLabel: reminder.label,
          firedAt: now,
          action: "snoozed",
          snoozeMinutes: minutes,
        };
        setHistory((prev) => [entry, ...prev].slice(0, 100));

        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session?.user?.id) return;
          supabase.from("user_reminders").update({ snooze_until: snoozeUntil, updated_at: now }).eq("id", id).catch(() => {});
          supabase.from("user_reminder_history").insert({
            id: entry.id,
            user_id: session.user.id,
            reminder_id: id,
            reminder_label: reminder.label,
            fired_at: now,
            action: "snoozed",
            snooze_minutes: minutes,
          }).catch(() => {});
        });
      }
    },
    [reminders]
  );

  const dismissReminder = useCallback(
    (id: string): void => {
      const now = new Date().toISOString();
      setReminders((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, snoozeUntil: null, updatedAt: now } : r
        )
      );
      const reminder = reminders.find((r) => r.id === id);
      if (reminder) {
        const entry: ReminderHistoryEntry = {
          id: generateId(),
          reminderId: id,
          reminderLabel: reminder.label,
          firedAt: now,
          action: "dismissed",
        };
        setHistory((prev) => [entry, ...prev].slice(0, 100));

        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session?.user?.id) return;
          supabase.from("user_reminders").update({ snooze_until: null, updated_at: now }).eq("id", id).catch(() => {});
          supabase.from("user_reminder_history").insert({
            id: entry.id,
            user_id: session.user.id,
            reminder_id: id,
            reminder_label: reminder.label,
            fired_at: now,
            action: "dismissed",
          }).catch(() => {});
        });
      }
    },
    [reminders]
  );

  const clearHistory = useCallback((): void => {
    setHistory([]);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.id) return;
      supabase.from("user_reminder_history").delete().eq("user_id", session.user.id).catch(() => {});
    });
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

