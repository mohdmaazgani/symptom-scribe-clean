import { HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import LegalPageLayout from "@/components/legal/LegalPageLayout";

const faqs = [
  {
    category: "General",
    questions: [
      {
        q: "What is Symptom Scribe?",
        a: "Symptom Scribe is an AI-powered health tracking platform that helps you monitor symptoms, track health metrics, and receive personalized wellness insights. It is designed for informational purposes only and does not replace professional medical advice.",
      },
      {
        q: "Is Symptom Scribe free to use?",
        a: "Yes! Symptom Scribe is completely free to use. Simply create an account and start tracking your health journey.",
      },
      {
        q: "Do I need to create an account?",
        a: "You need an account to access features like AI symptom analysis, health metrics tracking, and consultation history. Some public pages like this FAQ are accessible without an account.",
      },
    ],
  },
  {
    category: "Health & Medical",
    questions: [
      {
        q: "Is this a replacement for visiting a doctor?",
        a: "No. Symptom Scribe provides general health information and helps you understand when to seek professional medical care. It should never replace professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns.",
      },
      {
        q: "How accurate is the AI health analysis?",
        a: "Our AI is trained on medical knowledge bases and provides evidence-based insights. However, it is designed for educational purposes and preliminary assessment only. The accuracy depends on the quality and completeness of information you provide. For definitive diagnosis, always consult healthcare professionals.",
      },
      {
        q: "Can I use this for tracking chronic conditions?",
        a: "Yes! The platform is excellent for tracking chronic conditions over time. You can monitor symptoms, track medications, record vitals, and observe trends. However, always follow your doctor's treatment plan.",
      },
      {
        q: "What should I do in a medical emergency?",
        a: "Do NOT use Symptom Scribe in an emergency. Call your local emergency services immediately — 112, 911, or 999 depending on your country. Every second counts in an emergency.",
      },
    ],
  },
  {
    category: "Privacy & Security",
    questions: [
      {
        q: "Is my health data secure?",
        a: "Yes. All health data is encrypted both in transit and at rest. We comply with healthcare data protection standards and never share your personal health information with third parties without your explicit consent.",
      },
      {
        q: "Can I delete my data?",
        a: "Yes. You have full control over your data and can request deletion at any time through your account settings or by contacting our support team.",
      },
      {
        q: "Does Symptom Scribe sell my data?",
        a: "No. We never sell, trade, or rent your personal information to third parties. Your health data is yours alone.",
      },
    ],
  },
  {
    category: "Features",
    questions: [
      {
        q: "What features does the platform include?",
        a: "Symptom Scribe includes AI-powered symptom analysis, health metrics tracking, consultation history, brain games for cognitive health, emergency resources, health education facts, personalized dashboards, and comprehensive analytics.",
      },
      {
        q: "Is there a mobile app?",
        a: "Symptom Scribe is a progressive web application (PWA) that works seamlessly on all devices — desktop, tablet, and mobile. You can add it to your home screen for a native app-like experience. No separate download required!",
      },
      {
        q: "What are Brain Games?",
        a: "Brain Games are cognitive exercises designed to keep your mind sharp. They include memory matching, quick math, word recall, and pattern recognition games — all health-themed to make learning fun.",
      },
    ],
  },
];

const FAQItem = ({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) => {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-foreground">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {isOpen && (
        <p className="text-sm text-muted-foreground leading-relaxed pb-4">{a}</p>
      )}
    </div>
  );
};

const FAQ = () => {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const handleToggle = (key: string) => {
    setOpenItem(openItem === key ? null : key);
  };

  return (
    <LegalPageLayout title="Frequently Asked Questions" icon={HelpCircle} label="Resources">
      {/* Intro */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-6">
        <p className="text-foreground text-sm leading-relaxed">
          Find answers to the most common questions about Symptom Scribe below.
          Can't find what you're looking for?{" "}
          <a
            href="https://github.com/mohdmaazgani/symptom-scribe-clean/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
            aria-label="Open a GitHub Issue"
          >
            Open a GitHub Issue
          </a>{" "}
          and we'll help you out.
        </p>
      </div>

      {/* FAQ Categories */}
      {faqs.map((category) => (
        <div key={category.category} className="rounded-xl bg-card border border-border p-6 md:p-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 pb-3 border-b border-border">
            {category.category}
          </h2>
          <div>
            {category.questions.map((item) => {
              const key = `${category.category}-${item.q}`;
              return (
                <FAQItem
                  key={key}
                  q={item.q}
                  a={item.a}
                  isOpen={openItem === key}
                  onToggle={() => handleToggle(key)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </LegalPageLayout>
  );
};

export default FAQ;
