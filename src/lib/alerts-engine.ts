import { type OfflineMetric, type OfflineSymptom } from "@/lib/offline-db";

export interface SmartAlert {
  id: string;
  title: string;
  description: string;
  type: "info" | "warning" | "critical";
  actionPlan: string;
  metricType?: string;
  timestamp: string;
}

const DISMISSED_ALERTS_KEY = "symptom_scribe_dismissed_alerts";

export function getDismissedAlerts(): string[] {
  try {
    const stored = localStorage.getItem(DISMISSED_ALERTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function dismissAlert(alertId: string) {
  try {
    const dismissed = getDismissedAlerts();
    if (!dismissed.includes(alertId)) {
      dismissed.push(alertId);
      localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(dismissed));
    }
  } catch (err) {
    console.error("Failed to dismiss alert:", err);
  }
}

export function detectSmartAlerts(
  metrics: OfflineMetric[],
  symptoms: OfflineSymptom[]
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const dismissed = getDismissedAlerts();

  // Group metrics by type and sort descending by recorded_at
  const metricsByType = metrics.reduce<Record<string, OfflineMetric[]>>((acc, m) => {
    if (!acc[m.metric_type]) {
      acc[m.metric_type] = [];
    }
    acc[m.metric_type].push(m);
    return acc;
  }, {});

  // Sort each metric group to have the latest first
  Object.keys(metricsByType).forEach((type) => {
    metricsByType[type].sort(
      (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
    );
  });

  const getMetricVal = (m: OfflineMetric): number => {
    const val = m.value as { value?: number; systolic?: number; diastolic?: number } | null;
    return val?.value ? Number(val.value) : 0;
  };

  const getBPVal = (m: OfflineMetric): { systolic: number; diastolic: number } => {
    const val = m.value as { value?: number; systolic?: number; diastolic?: number } | null;
    return {
      systolic: val?.systolic ? Number(val.systolic) : 0,
      diastolic: val?.diastolic ? Number(val.diastolic) : 0,
    };
  };

  // 1. Heart Rate Rules
  const hrMetrics = metricsByType["heart_rate"] || [];
  if (hrMetrics.length >= 3) {
    const latestThree = hrMetrics.slice(0, 3);
    const hrValues = latestThree.map(getMetricVal);
    const latestRecord = latestThree[0];

    // Spike: All of the last 3 readings > 100 bpm
    if (hrValues.every((v) => v > 100)) {
      alerts.push({
        id: `heart-rate-spike-${latestRecord.id}`,
        title: "Elevated Heart Rate Detected",
        description: `Your last 3 heart rate readings show an elevated resting rate averaging ${Math.round(
          hrValues.reduce((a, b) => a + b, 0) / 3
        )} bpm.`,
        type: "warning",
        actionPlan: "Rest in a cool place, drink water, and avoid caffeine. If you experience chest pain, shortness of breath, or dizziness, seek medical help immediately.",
        metricType: "heart_rate",
        timestamp: latestRecord.recorded_at,
      });
    }

    // Low: All of the last 3 readings < 50 bpm
    if (hrValues.every((v) => v < 50 && v > 0)) {
      alerts.push({
        id: `heart-rate-low-${latestRecord.id}`,
        title: "Bradycardia Warning",
        description: `Your last 3 heart rate readings indicate a low heart rate averaging ${Math.round(
          hrValues.reduce((a, b) => a + b, 0) / 3
        )} bpm.`,
        type: "warning",
        actionPlan: "Avoid sudden posture changes (stand up slowly). Consult a physician if this is accompanied by fatigue, dizziness, or lightheadedness.",
        metricType: "heart_rate",
        timestamp: latestRecord.recorded_at,
      });
    }

    // Increasing trend: hr3 < hr2 < hr1
    if (hrValues[2] < hrValues[1] && hrValues[1] < hrValues[0]) {
      alerts.push({
        id: `heart-rate-increasing-${latestRecord.id}`,
        title: "Rising Heart Rate Trend",
        description: "Your resting heart rate has risen continuously across your last 3 logs.",
        type: "info",
        actionPlan: "Track your daily stress levels, hydration status, sleep quality, and active rest cycles to find potential triggers.",
        metricType: "heart_rate",
        timestamp: latestRecord.recorded_at,
      });
    }
  }

  // 2. Blood Pressure Rules
  const bpMetrics = metricsByType["blood_pressure"] || [];
  if (bpMetrics.length >= 3) {
    const latestThree = bpMetrics.slice(0, 3);
    const bpValues = latestThree.map(getBPVal);
    const latestRecord = latestThree[0];

    // High: Systolic > 140 or Diastolic > 90 for all 3
    if (bpValues.every((v) => v.systolic > 140 || v.diastolic > 90)) {
      alerts.push({
        id: `blood-pressure-high-${latestRecord.id}`,
        title: "Hypertension Warning",
        description: `Your last 3 blood pressure logs show elevated readings (above 140/90 mmHg).`,
        type: "warning",
        actionPlan: "Relax for 5 minutes and retake your measurement. Reduce sodium intake and contact your doctor if readings remain high over several days.",
        metricType: "blood_pressure",
        timestamp: latestRecord.recorded_at,
      });
    }

    // Low: Systolic < 90 or Diastolic < 60 for all 3.
    // Clinically, either systolic OR diastolic being low is sufficient to diagnose hypotension,
    // so we evaluate with OR logic. Explicit grouping parentheses added for operator precedence clarity.
    if (
      bpValues.every(
        (v) =>
          (v.systolic > 0 && v.systolic < 90) ||
          (v.diastolic > 0 && v.diastolic < 60)
      )
    ) {
      alerts.push({
        id: `blood-pressure-low-${latestRecord.id}`,
        title: "Hypotension Warning",
        description: `Your last 3 blood pressure readings indicate low blood pressure (below 90/60 mmHg).`,
        type: "warning",
        actionPlan: "Increase water and electrolyte intake. Lie down and elevate your legs if you feel faint or lightheaded.",
        metricType: "blood_pressure",
        timestamp: latestRecord.recorded_at,
      });
    }
  }

  // 3. Oxygen Saturation Rules
  const oxMetrics = metricsByType["oxygen_saturation"] || [];
  if (oxMetrics.length >= 2) {
    const latestTwo = oxMetrics.slice(0, 2);
    const oxValues = latestTwo.map(getMetricVal);
    const latestRecord = latestTwo[0];

    // SpO2 < 95%
    if (oxValues.every((v) => v < 95 && v > 0)) {
      alerts.push({
        id: `oxygen-saturation-low-${latestRecord.id}`,
        title: "Low Oxygen Saturation SpO2",
        description: `Your last 2 blood oxygen readings show SpO2 levels below 95% (${oxValues[0]}%).`,
        type: "critical",
        actionPlan: "Practice slow, deep breathing and sit upright. If SpO2 drops below 92% or you experience shortness of breath, seek emergency medical care.",
        metricType: "oxygen_saturation",
        timestamp: latestRecord.recorded_at,
      });
    }
  }

  // 4. Blood Sugar Rules
  const bsMetrics = metricsByType["blood_sugar"] || [];
  if (bsMetrics.length >= 3) {
    const latestThree = bsMetrics.slice(0, 3);
    const bsValues = latestThree.map(getMetricVal);
    const latestRecord = latestThree[0];

    // High: > 180 mg/dL
    if (bsValues.every((v) => v > 180)) {
      alerts.push({
        id: `blood-sugar-high-${latestRecord.id}`,
        title: "Hyperglycemia Alert",
        description: `Your blood glucose has been elevated across your last 3 logs, averaging ${Math.round(
          bsValues.reduce((a, b) => a + b, 0) / 3
        )} mg/dL.`,
        type: "warning",
        actionPlan: "Limit carbohydrate consumption, drink plenty of water, and consult your diabetes care plan or provider regarding insulin/medication adjustments.",
        metricType: "blood_sugar",
        timestamp: latestRecord.recorded_at,
      });
    }

    // Low: < 70 mg/dL (hypoglycemia). Checks the latest 2 readings.
    // Hypoglycemia is critical and requires prompt action, so we trigger the alert
    // on 2 consecutive low logs rather than waiting for 3 to avoid delaying care.
    if (bsValues.slice(0, 2).every((v) => v < 70 && v > 0)) {
      alerts.push({
        id: `blood-sugar-low-${latestRecord.id}`,
        title: "Hypoglycemia Warning",
        description: `Your blood glucose is critically low (below 70 mg/dL).`,
        type: "critical",
        actionPlan: "Follow the 15-15 rule: consume 15g of fast-acting carbs (juice, honey, candy) and re-test blood sugar in 15 minutes.",
        metricType: "blood_sugar",
        timestamp: latestRecord.recorded_at,
      });
    }
  }

  // 5. Temperature Rules
  const tempMetrics = metricsByType["temperature"] || [];
  if (tempMetrics.length >= 2) {
    const latestTwo = tempMetrics.slice(0, 2);
    const tempValues = latestTwo.map(getMetricVal);
    const latestRecord = latestTwo[0];

    // Fever: > 100.4 °F
    if (tempValues.every((v) => v > 100.4)) {
      alerts.push({
        id: `temperature-fever-${latestRecord.id}`,
        title: "Fever Warning",
        description: `Your body temperature has consistently been above 100.4°F (38°C).`,
        type: "warning",
        actionPlan: "Stay hydrated, rest, and use cold compresses. You can take over-the-counter fever reducers if appropriate, and monitor for infection symptoms.",
        metricType: "temperature",
        timestamp: latestRecord.recorded_at,
      });
    }
  }

  // 6. Symptom Burden Rules
  if (symptoms.length > 0) {
    const sortedSymptoms = [...symptoms].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // High severity frequency
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentHighSeverity = sortedSymptoms.filter(
      (s) => s.severity_level === "high" && new Date(s.created_at) > sevenDaysAgo
    );

    if (recentHighSeverity.length >= 3) {
      alerts.push({
        id: `symptom-burden-high-${recentHighSeverity[0].id}`,
        title: "High Symptom Burden",
        description: "You have reported 3 or more high-severity symptoms within the last 7 days.",
        type: "warning",
        actionPlan: "Review your logged consultations in detail and consult a doctor or healthcare professional to evaluate these frequent high-severity symptoms.",
        timestamp: recentHighSeverity[0].created_at,
      });
    }

    // Accumulating unresolved symptoms
    const unresolved = sortedSymptoms.filter((s) => !s.resolved);
    if (unresolved.length >= 3) {
      alerts.push({
        id: `symptom-unresolved-accumulating-${unresolved[0].id}`,
        title: "Unresolved Symptoms Accumulating",
        description: `You have ${unresolved.length} active symptoms in your history marked as unresolved.`,
        type: "info",
        actionPlan: "Visit your History tab to resolve symptoms that have improved, or consult the AI Health Assistant for ongoing guidance.",
        timestamp: unresolved[0].created_at,
      });
    }
  }

  // Filter out dismissed alerts
  return alerts.filter((alert) => !dismissed.includes(alert.id));
}
