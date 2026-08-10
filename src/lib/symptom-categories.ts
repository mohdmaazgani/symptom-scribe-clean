export interface SymptomCategory {
  id: string;
  name: string;
  color: string;
  isDefault?: boolean;
}

export const DEFAULT_CATEGORIES: SymptomCategory[] = [
  { id: "respiratory", name: "Respiratory", color: "#3b82f6", isDefault: true },
  { id: "digestive", name: "Digestive", color: "#f59e0b", isDefault: true },
  { id: "neurological", name: "Neurological", color: "#8b5cf6", isDefault: true },
  { id: "cardiovascular", name: "Cardiovascular", color: "#ef4444", isDefault: true },
  { id: "musculoskeletal", name: "Musculoskeletal", color: "#10b981", isDefault: true },
  { id: "dermatology", name: "Dermatology", color: "#ec4899", isDefault: true },
  { id: "mental", name: "Mental Health", color: "#06b6d4", isDefault: true },
  { id: "general", name: "General", color: "#6b7280", isDefault: true },
];

const STORAGE_KEY = "symptom_scribe_categories";

export function getCategories(): SymptomCategory[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_CATEGORIES;
    const parsed: SymptomCategory[] = JSON.parse(stored);
    
    // Ensure all default categories exist if not overridden
    const merged = [...parsed];
    DEFAULT_CATEGORIES.forEach((def) => {
      if (!merged.some((c) => c.id === def.id || c.name.toLowerCase() === def.name.toLowerCase())) {
        merged.push(def);
      }
    });
    return merged;
  } catch (error) {
    console.error("Failed to load symptom categories from storage:", error);
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: SymptomCategory[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error("Failed to save symptom categories to storage:", error);
  }
}

export function addCategory(name: string, color: string): SymptomCategory {
  const categories = getCategories();
  const trimmedName = name.trim();
  const existing = categories.find(
    (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (existing) {
    return existing;
  }

  const newCat: SymptomCategory = {
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: trimmedName,
    color,
    isDefault: false,
  };

  const updated = [...categories, newCat];
  saveCategories(updated);
  return newCat;
}

export function updateCategory(
  id: string,
  newName: string,
  newColor: string
): SymptomCategory[] {
  const categories = getCategories();
  const updated = categories.map((cat) => {
    if (cat.id === id) {
      return { ...cat, name: newName.trim(), color: newColor };
    }
    return cat;
  });
  saveCategories(updated);
  return updated;
}

export function deleteCategory(id: string): SymptomCategory[] {
  const categories = getCategories();
  const updated = categories.filter((cat) => cat.id !== id);
  saveCategories(updated);
  return updated;
}

export function getCategoryByName(name?: string): SymptomCategory {
  if (!name) return DEFAULT_CATEGORIES.find((c) => c.id === "general") || DEFAULT_CATEGORIES[7];
  const categories = getCategories();
  const found = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (found) return found;
  
  // Return fallback with General color or generated color
  return {
    id: `gen_${name}`,
    name,
    color: "#6b7280",
  };
}

export function autoDetectCategory(text: string): string {
  if (!text) return "General";
  const lower = text.toLowerCase();

  const rules: { category: string; keywords: string[] }[] = [
    {
      category: "Respiratory",
      keywords: ["cough", "shortness of breath", "asthma", "sore throat", "congestion", "wheezing", "flu", "cold", "runny nose", "sinus", "fever", "breathing"],
    },
    {
      category: "Digestive",
      keywords: ["nausea", "vomit", "stomach", "diarrhea", "acid reflux", "heartburn", "abdominal", "bloat", "constipation", "cramps", "gut", "indigestion"],
    },
    {
      category: "Neurological",
      keywords: ["headache", "migraine", "dizziness", "dizzy", "numbness", "tingling", "seizure", "vertigo", "confusion", "memory", "brain", "paralysis"],
    },
    {
      category: "Cardiovascular",
      keywords: ["chest pain", "palpitation", "rapid heart", "high blood pressure", "heart rate", "irregular beat", "lightheaded"],
    },
    {
      category: "Musculoskeletal",
      keywords: ["back pain", "joint", "muscle", "arthritis", "swelling", "stiffness", "sprain", "leg pain", "neck pain", "knee", "bone", "ache"],
    },
    {
      category: "Dermatology",
      keywords: ["rash", "itch", "eczema", "hives", "skin", "lesion", "acne", "psoriasis", "burn", "redness", "blister"],
    },
    {
      category: "Mental Health",
      keywords: ["anxiety", "depres", "insomnia", "stress", "panic", "fatigue", "mood", "sleep", "sad", "overwhelmed"],
    },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.category;
    }
  }

  return "General";
}
