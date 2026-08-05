import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, Heart, Brain, Activity, Apple, Moon } from "lucide-react";

const articles = [
  { icon: Heart, key: "heart" },
  { icon: Brain, key: "mental" },
  { icon: Activity, key: "vitals" },
  { icon: Apple, key: "nutrition" },
  { icon: Moon, key: "sleep" },
  { icon: BookOpen, key: "glossary" },
];

const HealthLibrary = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold mb-3">{t("healthLibrary.title")}</h1>
          <p className="text-muted-foreground text-lg">{t("healthLibrary.subtitle")}</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-semibold mb-8">{t("healthLibrary.featured")}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map(({ icon: Icon, key }) => (
            <div key={key} className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {t(`healthLibrary.articles.${key}.tag`)}
                </span>
              </div>
              <h3 className="font-semibold text-base mb-2">
                {t(`healthLibrary.articles.${key}.title`)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(`healthLibrary.articles.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="text-center py-12 px-6 bg-muted/30">
        <p className="text-muted-foreground mb-4">{t("healthLibrary.ctaQuestion")}</p>
        <Link
          to="/chat"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          {t("healthLibrary.ctaButton")}
        </Link>
      </section>
    </div>
  );
};

export default HealthLibrary;
