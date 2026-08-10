import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { browserEnv } from "@/lib/env";

export interface DailyAqi {
  date: string;
  aqi: number | null;
}

export interface EnvironmentalSnapshot {
  current: {
    temperatureC: number | null;
    pressureMsl: number | null;
    observedAt: string | null;
  };
  dailyAqi: DailyAqi[];
  fetchedAt: string;
  source: string;
}

export interface EnvironmentalInsight {
  snapshot: EnvironmentalSnapshot;
  matchedDays: number;
  totalLoggedDays: number;
  message: string | null;
}

// A day counts as "poor air quality" above this threshold (EPA "Unhealthy for
// Sensitive Groups" and above). See https://www.airnow.gov/aqi/aqi-basics/
const AQI_UNHEALTHY_THRESHOLD = 100;
const LOCAL_STORAGE_LOCATION_KEY = "environmental_insights_location";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — weather/AQI don't need to be fetched more often

interface Coordinates {
  latitude: number;
  longitude: number;
}

function loadSavedLocation(): Coordinates | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.latitude === "number" && typeof parsed?.longitude === "number") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function saveLocation(coords: Coordinates) {
  try {
    localStorage.setItem(LOCAL_STORAGE_LOCATION_KEY, JSON.stringify(coords));
  } catch {
    // Non-fatal — localStorage may be unavailable (private browsing, quota, etc.)
  }
}

/**
 * Given the symptom log dates the user already has loaded (e.g. from the
 * Dashboard's recent history) and a set of daily AQI readings, count how many
 * distinct symptom-log days fell on a day with poor air quality.
 */
function computeCorrelation(
  symptomDates: string[],
  dailyAqi: DailyAqi[]
): { matchedDays: number; totalLoggedDays: number } {
  const aqiByDate = new Map(dailyAqi.map((d) => [d.date, d.aqi]));
  const loggedDaySet = new Set(
    symptomDates.map((iso) => new Date(iso).toISOString().slice(0, 10))
  );

  let matchedDays = 0;
  for (const day of loggedDaySet) {
    const aqi = aqiByDate.get(day);
    if (typeof aqi === "number" && aqi >= AQI_UNHEALTHY_THRESHOLD) {
      matchedDays += 1;
    }
  }

  return { matchedDays, totalLoggedDays: loggedDaySet.size };
}

/**
 * Fetches environmental (weather + air quality) data for an opt-in location
 * and cross-references it against the user's recent symptom log dates to
 * surface a simple "did poor air quality line up with your symptoms" insight.
 *
 * Location is never collected automatically — the caller must invoke
 * `requestLocation()` (browser geolocation) or `setManualLocation()`.
 */
export function useEnvironmentalInsights(symptomLogDates: string[]) {
  const [location, setLocation] = useState<Coordinates | null>(() => loadSavedLocation());
  const [insight, setInsight] = useState<EnvironmentalInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSnapshot = useCallback(async (coords: Coordinates) => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token || browserEnv.supabasePublishableKey;

      const response = await fetch(browserEnv.getSupabaseFunctionUrl("get-environmental-data"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(coords),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to fetch environmental data");
      }

      const snapshot = (await response.json()) as EnvironmentalSnapshot;
      const { matchedDays, totalLoggedDays } = computeCorrelation(
        symptomLogDates,
        snapshot.dailyAqi
      );

      let message: string | null = null;
      if (totalLoggedDays > 0 && matchedDays > 0) {
        message = `${matchedDays} of your ${totalLoggedDays} symptom log day${
          totalLoggedDays === 1 ? "" : "s"
        } in the past week happened on a day with poor air quality (AQI ≥ ${AQI_UNHEALTHY_THRESHOLD}).`;
      } else if (totalLoggedDays > 0) {
        message = `None of your ${totalLoggedDays} recent symptom log day${
          totalLoggedDays === 1 ? "" : "s"
        } lined up with poor air quality this week.`;
      }

      setInsight({ snapshot, matchedDays, totalLoggedDays, message });
    } catch (err) {
      console.error("useEnvironmentalInsights error:", err);
      setError(err instanceof Error ? err.message : "Failed to load environmental insights");
    } finally {
      setLoading(false);
    }
    // symptomLogDates intentionally excluded from deps — recomputing per render
    // would refetch the network call unnecessarily; the correlation is cheap
    // enough to recompute the next time the snapshot is fetched anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location) {
      fetchSnapshot(location);
    }
    // Re-fetch at most once per hour if the component stays mounted.
    const interval = setInterval(() => {
      if (location) fetchSnapshot(location);
    }, CACHE_TTL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Location access is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        saveLocation(coords);
        setLocation(coords);
      },
      (geoError) => {
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission denied. You can enter coordinates manually instead."
            : "Couldn't determine your location. You can enter coordinates manually instead."
        );
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  const setManualLocation = useCallback((coords: Coordinates) => {
    saveLocation(coords);
    setLocation(coords);
  }, []);

  const clearLocation = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_LOCATION_KEY);
    } catch {
      // ignore
    }
    setLocation(null);
    setInsight(null);
  }, []);

  return {
    hasLocation: Boolean(location),
    insight,
    loading,
    error,
    requestLocation,
    setManualLocation,
    clearLocation,
  };
}
