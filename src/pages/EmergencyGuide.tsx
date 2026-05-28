import { AlertTriangle, Phone, Heart, Wind, Thermometer, Brain, ShieldAlert, CheckCircle2 } from "lucide-react";
import LegalPageLayout from "@/components/legal/LegalPageLayout";

const emergencyNumbers = [
  { country: "India", number: "112", alt: "108 (Ambulance)" },
  { country: "USA", number: "911", alt: "Poison Control: 1-800-222-1222" },
  { country: "UK", number: "999", alt: "111 (Non-emergency)" },
  { country: "Europe", number: "112", alt: "Universal EU number" },
  { country: "Australia", number: "000", alt: "Ambulance: 000" },
  { country: "Canada", number: "911", alt: "Same as USA" },
];

const warningSigns = [
  { icon: Heart, title: "Heart Attack", signs: ["Chest pain or pressure", "Pain spreading to arm or jaw", "Shortness of breath", "Nausea or cold sweat"] },
  { icon: Brain, title: "Stroke", signs: ["Face drooping on one side", "Arm weakness or numbness", "Speech difficulty or slurred", "Sudden severe headache"] },
  { icon: Wind, title: "Breathing Emergency", signs: ["Severe shortness of breath", "Lips or fingernails turning blue", "Cannot speak in full sentences", "Rapid or very slow breathing"] },
  { icon: Thermometer, title: "Severe Allergic Reaction", signs: ["Throat swelling or tightening", "Difficulty swallowing", "Hives or skin swelling", "Dizziness or loss of consciousness"] },
];

const firstAidSteps = [
  {
    title: "CPR (Adult)",
    steps: [
      "Call emergency services immediately (112/911)",
      "Place heel of hand on center of chest",
      "Push down hard and fast — 100-120 compressions per minute",
      "Allow chest to fully rise between compressions",
      "Continue until help arrives or person recovers",
    ],
  },
  {
    title: "Choking (Heimlich Maneuver)",
    steps: [
      "Ask 'Are you choking?' — if they can't speak or cough, act immediately",
      "Stand behind the person and lean them slightly forward",
      "Give 5 firm back blows between shoulder blades",
      "Give 5 abdominal thrusts — hands just above navel",
      "Alternate back blows and abdominal thrusts until object is dislodged",
    ],
  },
  {
    title: "Severe Bleeding",
    steps: [
      "Call emergency services if bleeding is severe",
      "Apply firm pressure with a clean cloth or bandage",
      "Do not remove the cloth — add more on top if soaked",
      "Elevate the injured area above heart level if possible",
      "Keep pressure until help arrives",
    ],
  },
];

const EmergencyGuide = () => {
  return (
    <LegalPageLayout title="Emergency Guide" icon={ShieldAlert} label="Resources">

      {/* Emergency Banner */}
      <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-5 flex flex-col sm:flex-row gap-4">
        <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-foreground font-semibold text-sm mb-1">In a life-threatening emergency:</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Call your local emergency number immediately. Do not use this guide as a substitute
            for professional emergency medical care. Every second counts.
          </p>
        </div>
      </div>

      {/* Emergency Numbers */}
      <div className="rounded-xl bg-card border border-border p-6 md:p-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 pb-3 border-b border-border flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary" aria-hidden="true" />
          Emergency Numbers by Country
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {emergencyNumbers.map(({ country, number, alt }) => (
            <div key={country} className="rounded-lg bg-background border border-border p-4">
              <p className="text-xs text-muted-foreground mb-1">{country}</p>
              <p className="text-3xl font-bold text-primary mb-1">{number}</p>
              <p className="text-xs text-muted-foreground">{alt}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Warning Signs */}
      <div className="rounded-xl bg-card border border-border p-6 md:p-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 pb-3 border-b border-border">
          Warning Signs — Call Emergency Services Immediately
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {warningSigns.map(({ icon: Icon, title, signs }) => (
            <div key={title} className="rounded-lg bg-background border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-destructive/10 border border-destructive/20" aria-hidden="true">
                  <Icon className="w-4 h-4 text-destructive" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">{title}</h3>
              </div>
              <ul className="space-y-1.5">
                {signs.map((sign) => (
                  <li key={sign} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                    {sign}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* First Aid Steps */}
      <div className="rounded-xl bg-card border border-border p-6 md:p-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 pb-3 border-b border-border">
          Basic First Aid Guides
        </h2>
        <div className="flex flex-col gap-6">
          {firstAidSteps.map(({ title, steps }) => (
            <div key={title}>
              <h3 className="font-semibold text-foreground text-sm mb-3">{title}</h3>
              <div className="flex flex-col gap-2">
                {steps.map((step, i) => (
                  <div key={step} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs flex items-center justify-center shrink-0 font-medium mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl bg-card border border-border p-6 md:p-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 pb-3 border-b border-border">
          Important Disclaimer
        </h2>
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          {[
            "This guide is for general educational purposes only and does not replace professional medical training.",
            "Always call emergency services first before attempting first aid.",
            "Consider taking a certified first aid course for proper training.",
            "Symptom Scribe is not liable for any outcomes resulting from use of this guide.",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              {item}
            </div>
          ))}
        </div>
      </div>

    </LegalPageLayout>
  );
};

export default EmergencyGuide;
