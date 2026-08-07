import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import hi from "./locales/hi.json";
import te from "./locales/te.json";

export const LANGUAGE_STORAGE_KEY = "app-language";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "te", label: "తెలుగు (Telugu)" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  te: { translation: te },
};

const readStoredLanguage = (): LanguageCode => {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.some((lang) => lang.code === stored)) {
      return stored as LanguageCode;
    }
  } catch (error) {
    console.warn("Unable to read stored language:", error);
  }
  return "en";
};

const syncDocumentLanguage = (language: string) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }
};

void i18n.use(initReactI18next).init({
  resources,
  lng: readStoredLanguage(),
  fallbackLng: "en",
  supportedLngs: SUPPORTED_LANGUAGES.map((lang) => lang.code),
  interpolation: {
    escapeValue: false,
  },
});

syncDocumentLanguage(i18n.language);
i18n.on("languageChanged", syncDocumentLanguage);

export const changeLanguage = async (code: LanguageCode) => {
  await i18n.changeLanguage(code);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch (error) {
    console.warn("Unable to persist language preference:", error);
  }
};

export default i18n;
