import { useState } from "react";
import { BookOpen, Heart, Brain, Wind, Apple, Moon, Activity, Search, ChevronDown } from "lucide-react";
import LegalPageLayout from "@/components/legal/LegalPageLayout";

const articles = [
  {
    id: "heart-health",
    icon: Heart,
    category: "Cardiology",
    title: "Understanding Heart Health",
    summary: "Learn about maintaining cardiovascular wellness through diet and exercise.",
    content: "Your heart is one of the most vital organs in your body. Cardiovascular health is maintained through regular exercise (at least 150 minutes of moderate activity per week), a diet low in saturated fats and sodium, not smoking, managing stress, and regular health check-ups. Key metrics to monitor include blood pressure (target below 120/80 mmHg), cholesterol levels, and resting heart rate.",
  },
  {
    id: "mental-health",
    icon: Brain,
    category: "Mental Health",
    title: "Mental Health Basics",
    summary: "A guide to recognizing signs of stress, anxiety, and how to seek help.",
    content: "Mental health is just as important as physical health. Common signs of stress and anxiety include persistent worry, difficulty sleeping, irritability, and physical symptoms like headaches or stomach aches. Effective strategies include regular exercise, mindfulness meditation, maintaining social connections, limiting alcohol, and seeking professional help when needed. Remember — asking for help is a sign of strength, not weakness.",
  },
  {
    id: "respiratory",
    icon: Wind,
    category: "Respiratory",
    title: "Respiratory Health",
    summary: "How to maintain healthy lungs and recognize breathing problems.",
    content: "Healthy lungs are essential for overall wellbeing. Avoid smoking and secondhand smoke, which are the leading causes of lung disease. Regular aerobic exercise strengthens respiratory muscles. Signs of respiratory problems include persistent cough, shortness of breath at rest, wheezing, or coughing up blood. Air quality affects lung health — use air purifiers indoors and check air quality indexes before outdoor exercise.",
  },
  {
    id: "nutrition",
    icon: Apple,
    category: "Nutrition",
    title: "Nutrition & Diet",
    summary: "Evidence-based guidance on balanced eating and nutritional choices.",
    content: "A balanced diet is the foundation of good health. Focus on whole foods — fruits, vegetables, whole grains, lean proteins, and healthy fats. Aim for at least 5 servings of fruits and vegetables daily. Limit ultra-processed foods, added sugars, and excessive sodium. Stay hydrated with 8+ glasses of water daily. Consider consulting a registered dietitian for personalized guidance, especially if you have specific health conditions.",
  },
  {
    id: "sleep",
    icon: Moon,
    category: "Sleep",
    title: "Sleep & Recovery",
    summary: "The science of sleep and why quality rest is critical for good health.",
    content: "Adults need 7-9 hours of quality sleep per night. Sleep is when your body repairs tissues, consolidates memories, and regulates hormones. Poor sleep is linked to obesity, heart disease, diabetes, and mental health issues. Improve sleep hygiene by keeping a consistent schedule, making your bedroom cool and dark, avoiding screens before bed, and limiting caffeine after 2pm. If you consistently struggle with sleep, consult a doctor about possible sleep disorders.",
  },
  {
    id: "exercise",
    icon: Activity,
    category: "Fitness",
    title: "Exercise & Physical Wellness",
    summary: "How to build and maintain a healthy exercise routine for all fitness levels.",
    content: "The WHO recommends at least 150-300 minutes of moderate aerobic activity or 75-150 minutes of vigorous activity per week, plus muscle-strengthening activities twice a week. Start slowly and gradually increase intensity to avoid injury. Mix cardio (walking, cycling, swimming) with strength training and flexibility work. Exercise improves mood, reduces chronic disease risk, supports healthy weight, and boosts energy levels. Find activities you enjoy — consistency matters more than intensity.",
  },
];

const categories = ["All", "Cardiology", "Mental Health", "Respiratory", "Nutrition", "Sleep", "Fitness"];

const HealthLibrary = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = articles.filter((a) => {
    const matchesCategory = activeCategory === "All" || a.category === activeCategory;
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <LegalPageLayout title="Health Library" icon={BookOpen} label="Resources">

      {/* Intro */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-6">
        <p className="text-foreground text-sm leading-relaxed">
          Trusted, evidence-based health information to help you make informed decisions
          about your wellbeing. All content is for educational purposes only and does not
          replace professional medical advice.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search health topics..."
          aria-label="Search health topics"
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            aria-pressed={activeCategory === cat}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles — single column accordion style */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-card border border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">No articles found. Try a different search or category.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          {filtered.map(({ id, icon: Icon, category, title, summary, content }, index) => (
            <div
              key={id}
              className={`${index !== 0 ? "border-t border-border" : ""}`}
            >
              {/* Header — always visible */}
              <button
                onClick={() => setExpandedId(expandedId === id ? null : id)}
                aria-expanded={expandedId === id}
                aria-label={expandedId === id ? `Collapse ${title}` : `Read more about ${title}`}
                className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 shrink-0" aria-hidden="true">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-primary">{category}</span>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5 truncate">{summary}</p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                    expandedId === id ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              {/* Expanded content */}
              {expandedId === id && (
                <div className="px-5 pb-5 border-t border-border bg-muted/30">
                  <p className="text-sm text-muted-foreground leading-relaxed pt-4">{content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="rounded-xl bg-card border border-border p-5 flex gap-3">
        <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          All articles in the Health Library are for general educational purposes only.
          Always consult a qualified healthcare professional before making any health decisions.
        </p>
      </div>

    </LegalPageLayout>
  );
};

export default HealthLibrary;