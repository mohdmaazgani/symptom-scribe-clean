import { describe, it, expect, beforeEach } from "vitest";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getCategoryByName,
  autoDetectCategory,
  DEFAULT_CATEGORIES,
} from "./symptom-categories";

describe("Symptom Categories Utilities", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns default categories when no custom categories are stored", () => {
    const categories = getCategories();
    expect(categories.length).toBeGreaterThanOrEqual(DEFAULT_CATEGORIES.length);
    expect(categories.some((c) => c.name === "Respiratory")).toBe(true);
    expect(categories.some((c) => c.name === "Digestive")).toBe(true);
  });

  it("allows adding a custom category", () => {
    const newCat = addCategory("Cardio Special", "#ff0055");
    expect(newCat.name).toBe("Cardio Special");
    expect(newCat.color).toBe("#ff0055");

    const categories = getCategories();
    expect(categories.some((c) => c.name === "Cardio Special")).toBe(true);
  });

  it("updates existing category name and color", () => {
    const newCat = addCategory("Original Name", "#111111");
    const updated = updateCategory(newCat.id, "Renamed Category", "#222222");
    expect(updated.some((c) => c.id === newCat.id && c.name === "Renamed Category" && c.color === "#222222")).toBe(true);
  });

  it("deletes custom category", () => {
    const newCat = addCategory("To Delete", "#333333");
    deleteCategory(newCat.id);
    const categories = getCategories();
    expect(categories.some((c) => c.id === newCat.id)).toBe(false);
  });

  it("finds category by name case-insensitively", () => {
    const category = getCategoryByName("respiratory");
    expect(category.name).toBe("Respiratory");
    expect(category.color).toBe("#3b82f6");
  });

  it("auto-detects categories correctly based on symptoms text keywords", () => {
    expect(autoDetectCategory("Severe cough and fever")).toBe("Respiratory");
    expect(autoDetectCategory("Stomach pain and nausea")).toBe("Digestive");
    expect(autoDetectCategory("Throbbing headache and dizziness")).toBe("Neurological");
    expect(autoDetectCategory("Chest pain and palpitations")).toBe("Cardiovascular");
    expect(autoDetectCategory("Lower back pain and stiff knee joint")).toBe("Musculoskeletal");
    expect(autoDetectCategory("Itchy red skin rash")).toBe("Dermatology");
    expect(autoDetectCategory("Anxiety and insomnia at night")).toBe("Mental Health");
    expect(autoDetectCategory("Feeling slightly unwell")).toBe("General");
  });
});
