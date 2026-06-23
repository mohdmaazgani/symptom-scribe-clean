import { Link } from "react-router-dom";
import { BookOpen, Heart, Brain, Activity, Apple, Moon } from "lucide-react";

const articles = [
  { icon: Heart, title: "Understanding Heart Health", desc: "Learn about maintaining cardiovascular wellness through diet and exercise.", tag: "Cardiology" },
  { icon: Brain, title: "Mental Health Basics", desc: "A guide to recognizing signs of stress, anxiety, and how to seek help.", tag: "Mental Health" },
  { icon: Activity, title: "Tracking Your Vitals", desc: "How to monitor blood pressure, heart rate, and other key metrics at home.", tag: "Wellness" },
  { icon: Apple, title: "Nutrition & Diet", desc: "Evidence-based guidance on balanced eating and nutritional choices.", tag: "Nutrition" },
  { icon: Moon, title: "Sleep & Recovery", desc: "The science of sleep and why quality rest is critical for good health.", tag: "Sleep" },
  { icon: BookOpen, title: "Symptom Glossary", desc: "An A–Z reference of common symptoms, their causes, and when to seek care.", tag: "Reference" },
];

const HealthLibrary = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold mb-3">Health Library</h1>
          <p className="text-muted-foreground text-lg">
            Trusted, evidence-based health information to help you make informed decisions about your wellbeing.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-semibold mb-8">Featured Articles</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map(({ icon: Icon, title, desc, tag }) => (
            <div key={title} className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{tag}</span>
              </div>
              <h3 className="font-semibold text-base mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="text-center py-12 px-6 bg-muted/30">
        <p className="text-muted-foreground mb-4">Have a health question? Let our AI assistant help.</p>
        <Link
          to="/chat"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Ask AI Symptom Checker
        </Link>
      </section>
    </div>
  );
};

export default HealthLibrary;
