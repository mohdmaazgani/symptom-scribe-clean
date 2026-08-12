import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { SUPPORTED_LANGUAGES, changeLanguage, type LanguageCode } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const handleChange = (code: LanguageCode) => {
    void changeLanguage(code);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user?.id) return;
      supabase
        .from("profiles")
        .upsert(
          {
            user_id: session.user.id,
            language: code,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .catch((err) => console.warn("Failed to sync language preference to profile:", err));
    });
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
        {SUPPORTED_LANGUAGES.map((lang) => (
          <Button
            key={lang.code}
            variant={i18n.resolvedLanguage === lang.code ? "default" : "outline"}
            onClick={() => handleChange(lang.code)}
          >
            {lang.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default LanguageSwitcher;
