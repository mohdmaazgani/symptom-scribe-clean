import { useState } from "react";

export interface RegionData {
  symptoms: string[];
  description: string;
  emergencyWarning: string;
}

const REGION_SYMPTOMS_DB: Record<string, RegionData> = {
  head: {
    symptoms: ["Headaches / Migraines", "Dizziness / Vertigo", "Confusion / Brain Fog", "Sinus Pressure", "Tinnitus (Ringing Ears)"],
    description: "Symptomatology in the cranial region can represent structural, sinus-related, ophthalmic, or nervous system issues.",
    emergencyWarning: "Sudden onset of severe headache ('thunderclap'), unilateral facial droop, arm weakness, or difficulty speaking requires immediate emergency intervention.",
  },
  chest: {
    symptoms: ["Heart Palpitations", "Shortness of Breath (Dyspnea)", "Acid Reflux / Heartburn", "Coughing / Wheezing", "Chest Wall Soreness"],
    description: "The thoracic region contains vital cardiac and pulmonary structures. Intercostal muscle strain, asthma flares, and gastric reflux can trigger chest-area symptoms.",
    emergencyWarning: "Crushing chest pain, pressure radiating to the shoulder, back, jaw, or left arm, accompanied by cold sweat, is a medical emergency.",
  },
  "spine-upper": {
    symptoms: ["Cervical Stiffness", "Shoulder Blade Tension", "Upper Back Aches"],
    description: "Upper back and spine discomfort commonly correlates with poor ergonomic posture, muscular spasm, or minor vertebral disc compression.",
    emergencyWarning: "Unrelenting thoracic pain with radiating numbness, loss of bladder control, or history of major trauma warrants emergency evaluation.",
  },
  abdomen: {
    symptoms: ["Stomach Bloating", "Sharp/Dull Abdominal Pain", "Nausea / Indigestion", "Digestive Irregularities"],
    description: "Abdominal discomfort is often gastrointestinal, renal, or gall-bladder related.",
    emergencyWarning: "Severe, rigid abdominal guard pain, inability to keep fluids down, high fever, or black bloody stools needs urgent medical attention.",
  },
  "lower-back": {
    symptoms: ["Lumbar Soreness", "Sciatic Radiating Pain", "Sacroiliac Joint Ache", "Muscle Spasms"],
    description: "Lower spine strain affects over 80% of adults. Lift heavy items with knees bent.",
    emergencyWarning: "Lower back pain accompanied by saddle anesthesia (numbness in groin), leg paralysis, or bowel dysfunction suggests Cauda Equina and is an emergency.",
  },
  arms: {
    symptoms: ["Joint Stiff/Arthritis", "Numbness / Carpal Tunnel", "Tennis Elbow Strain"],
    description: "Upper extremity issues often derive from overuse injuries, tendonitis, or peripheral nerve entrapment (median/ulnar).",
    emergencyWarning: "Sudden onset of left arm weakness or loss of coordination is a primary sign of cerebrovascular stroke.",
  },
  legs: {
    symptoms: ["Knee Joint Soreness", "Calf Cramping (Charley Horse)", "Ankle Swelling"],
    description: "Lower extremity metrics relate to weight-bearing wear, circulatory returns, or lumbar nerve irritation radiating downward.",
    emergencyWarning: "Swelling, redness, heat, and severe pain in a single calf are signs of a Deep Vein Thrombosis (DVT) and require rapid medical checks.",
  },
};

export const useBodyMap = () => {
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [isFront, setIsFront] = useState(true);

  const handleRegionSelect = (region: string) => {
    setActiveRegion(region);
  };

  const clearSelection = () => {
    setActiveRegion(null);
  };

  const regionSymptoms = activeRegion ? REGION_SYMPTOMS_DB[activeRegion] : {
    symptoms: [],
    description: "",
    emergencyWarning: ""
  };

  return {
    activeRegion,
    handleRegionSelect,
    isFront,
    setIsFront,
    regionSymptoms,
    clearSelection,
  };
};

export default useBodyMap;