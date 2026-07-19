import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "te", label: "తెలుగు (Telugu)" },
];

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem("app-language", code);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="w-5 h-5" />
          {t("settings.language")}
        </CardTitle>
        <CardDescription>{t("settings.languageDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {LANGUAGES.map((lang) => (
          <Button
            key={lang.code}
            variant={i18n.language === lang.code ? "default" : "outline"}
            onClick={() => changeLanguage(lang.code)}
          >
            {lang.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default LanguageSwitcher;