import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Phone, AlertTriangle, MapPin, ExternalLink,
  Heart, Wind, Brain, Thermometer, Zap, Clock,
  ChevronDown, ChevronUp, CheckCircle2, Copy, Share2
} from "lucide-react";
import { showSuccess, showInfo } from "@/lib/toast-helpers";

const emergencyNumbers = [
  { country: "USA", number: "911", description: "Emergency Services" },
  { country: "UK", number: "999", description: "Emergency Services" },
  { country: "Europe", number: "112", description: "Emergency Services" },
  { country: "India", number: "102", description: "Ambulance" },
  { country: "Australia", number: "000", description: "Emergency Services" },
  { country: "Canada", number: "911", description: "Emergency Services" },
  { country: "Japan", number: "119", description: "Ambulance & Fire" },
  { country: "Germany", number: "112", description: "Emergency Services" },
  { country: "France", number: "15", description: "Medical Emergency (SAMU)" },
  { country: "Brazil", number: "192", description: "Medical Emergency (SAMU)" },
];

const crisisHotlines = [
  { name: "National Suicide Prevention Lifeline", contact: "988", type: "call", country: "USA" },
  { name: "Crisis Text Line", contact: "Text HOME to 741741", type: "text", country: "USA/CA/UK/IE" },
  { name: "Samaritans", contact: "116 123", type: "call", country: "UK & Ireland" },
  { name: "iCall", contact: "9152987821", type: "call", country: "India" },
  { name: "Lifeline", contact: "13 11 14", type: "call", country: "Australia" },
  { name: "Kids Help Phone", contact: "1-800-668-6868", type: "call", country: "Canada" },
];

// First aid steps with expandable details
const firstAidGuides = [
  {
    id: "cpr",
    icon: Heart,
    title: "CPR (Cardiac Arrest)",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    urgency: "LIFE THREATENING",
    steps: [
      "Call emergency services (911/999/112) immediately or ask someone else to call",
      "Lay the person flat on their back on a firm surface",
      "Place the heel of your hand on the centre of their chest, then your other hand on top. Interlace fingers",
      "Push hard and fast — compress at least 2 inches (5cm) deep, 100–120 times per minute (to the beat of 'Stayin' Alive')",
      "If trained: give 2 rescue breaths after every 30 compressions. If not trained: continue chest compressions only",
      "Continue until emergency services arrive, the person recovers, or you are physically unable to continue",
    ],
  },
  {
    id: "choking",
    icon: Wind,
    title: "Choking (Adult)",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    urgency: "LIFE THREATENING",
    steps: [
      "Ask 'Are you choking?' — if they cannot speak, cough, or breathe, act immediately",
      "Stand behind the person, slightly to one side. Support their chest with one hand",
      "Lean them forward and give up to 5 firm back blows between the shoulder blades with the heel of your hand",
      "If back blows fail: give up to 5 abdominal thrusts (Heimlich manoeuvre). Place a fist above the navel, grasp with other hand, pull sharply inward and upward",
      "Alternate 5 back blows with 5 abdominal thrusts until the blockage clears",
      "If the person becomes unconscious, call emergency services and begin CPR",
    ],
  },
  {
    id: "stroke",
    icon: Brain,
    title: "Stroke — FAST Test",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    urgency: "CALL 911 IMMEDIATELY",
    steps: [
      "F — FACE: Ask them to smile. Is one side drooping?",
      "A — ARMS: Ask them to raise both arms. Does one drift downward?",
      "S — SPEECH: Ask them to repeat a simple phrase. Is it slurred or strange?",
      "T — TIME: If ANY of the above, call emergency services immediately. Note the time symptoms started",
      "Do NOT give food or water — swallowing may be impaired",
      "Keep them calm, comfortable and still. Do not leave them alone. Let emergency services guide you",
    ],
  },
  {
    id: "burns",
    icon: Thermometer,
    title: "Severe Burns",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    urgency: "CALL 911 IF SEVERE",
    steps: [
      "Remove the person from danger. Do NOT remove clothing stuck to the burn",
      "Cool the burn under cool (not cold/ice) running water for at least 20 minutes",
      "Do NOT use butter, toothpaste, oils or ice — these cause more damage",
      "Cover loosely with cling film or a clean non-fluffy material (e.g. a clean plastic bag)",
      "Call emergency services if: burn is larger than a palm, on face/hands/genitals, deep/blistered, caused by chemicals or electricity",
      "Keep the person warm and monitor for shock (pale, cold, clammy skin, rapid breathing)",
    ],
  },
  {
    id: "bleeding",
    icon: Zap,
    title: "Severe Bleeding",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    urgency: "CALL 911 IF SEVERE",
    steps: [
      "Call emergency services if bleeding is severe or doesn't stop",
      "Apply firm, direct pressure to the wound with a clean cloth or bandage. Do NOT remove it",
      "If an object is embedded in the wound, do NOT remove it — apply pressure around it",
      "Elevate the injured area above the level of the heart if possible",
      "If the cloth soaks through, apply another layer on top — do not remove the first",
      "Watch for signs of shock: pale/cold/clammy skin, rapid weak pulse, confusion. Lay person flat, elevate legs, keep warm",
    ],
  },
];

const reminders = [
  "Always call emergency services first in a life-threatening situation",
  "Stay on the line and follow dispatcher instructions carefully",
  "Provide your exact location — street address, landmarks, floor number",
  "Keep your emergency contacts updated in your profile",
  "Have your medical information and allergies readily available",
  "Know basic first aid — consider taking a certified course",
];

// ─── Component ─────────────────────────────────────────────────────────────

const Emergency = () => {
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [searchCountry, setSearchCountry] = useState("");
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const filteredNumbers = emergencyNumbers.filter(
    (n) =>
      n.country.toLowerCase().includes(searchCountry.toLowerCase()) ||
      n.number.includes(searchCountry)
  );

  const handleCopyNumber = (number: string, country: string) => {
    navigator.clipboard.writeText(number);
    setCopiedNumber(number);
    showSuccess("Copied!", `${country} emergency number copied`);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handleSharePage = () => {
    if (navigator.share) {
      navigator.share({
        title: "Emergency Resources — Smart Health Tracker",
        text: "Emergency numbers and first aid guides",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showInfo("Link copied!", "Share this emergency page with others");
    }
  };

  const toggleGuide = (id: string) => {
    setExpandedGuide((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            Emergency Resources
          </h1>
          <p className="text-muted-foreground">Quick access to emergency contacts, first aid guides, and crisis support</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{currentTime.toLocaleTimeString()}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleSharePage} className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>

      {/* WHEN TO CALL — always at the top, most important */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Call Emergency Services Immediately If You See:
          </CardTitle>
          <CardDescription>
            Do not wait — every second matters in these situations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "Chest pain or pressure lasting more than a few minutes",
              "Difficulty breathing or shortness of breath",
              "Sudden numbness or weakness on one side of the body",
              "Sudden confusion, trouble speaking or understanding",
              "Uncontrolled severe bleeding",
              "Severe allergic reaction (lips/throat swelling, difficulty breathing)",
              "Loss of consciousness or unresponsiveness",
              "Suicidal thoughts or intent to self-harm",
              "Severe burns covering large areas",
              "Suspected poisoning or overdose",
            ].map((sign, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <span>{sign}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FIRST AID GUIDES — the real functional addition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            First Aid Step-by-Step Guides
          </CardTitle>
          <CardDescription>
            Tap any situation for detailed instructions — these could save a life
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {firstAidGuides.map((guide) => {
            const Icon = guide.icon;
            const isOpen = expandedGuide === guide.id;
            return (
              <div
                key={guide.id}
                className={`border rounded-xl overflow-hidden transition-all duration-200 ${guide.border}`}
              >
                {/* Guide header — always visible, clickable */}
                <button
                  onClick={() => toggleGuide(guide.id)}
                  className={`w-full flex items-center justify-between p-4 ${guide.bg} hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${guide.color} flex-shrink-0`} />
                    <div className="text-left">
                      <p className="font-semibold text-foreground">{guide.title}</p>
                      <span className={`text-xs font-bold ${guide.color}`}>{guide.urgency}</span>
                    </div>
                  </div>
                  {isOpen
                    ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  }
                </button>

                {/* Expandable steps */}
                {isOpen && (
                  <div className="p-4 bg-card border-t border-border space-y-2">
                    {guide.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5 ${
                          guide.color.replace("text-", "bg-")
                        }`}>
                          {idx + 1}
                        </div>
                        <p className="text-sm leading-relaxed text-foreground">{step}</p>
                      </div>
                    ))}
                    <div className="mt-4 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground italic">
                        ⚠️ This is general guidance only. Always follow instructions from emergency dispatchers and medical professionals.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* EMERGENCY NUMBERS — searchable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Emergency Numbers by Country
          </CardTitle>
          <CardDescription>Search by country name or number</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search country or number..."
            value={searchCountry}
            onChange={(e) => setSearchCountry(e.target.value)}
            className="max-w-sm"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredNumbers.map((item, idx) => (
              <Card key={idx} className="bg-accent group">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">{item.country}</p>
                      <p className="text-3xl font-bold text-primary mb-1">{item.number}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <button
                      onClick={() => handleCopyNumber(item.number, item.country)}
                      className="p-2 rounded-lg hover:bg-primary/10 transition-colors mt-1"
                      title="Copy number"
                    >
                      {copiedNumber === item.number
                        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                        : <Copy className="w-4 h-4 text-muted-foreground" />
                      }
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredNumbers.length === 0 && (
              <p className="text-muted-foreground text-sm col-span-3 py-4 text-center">
                No results for "{searchCountry}"
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* FIND HOSPITAL + CRISIS HOTLINES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Find Nearby Hospitals
            </CardTitle>
            <CardDescription>Opens Google Maps with hospitals near your current location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={() => window.open("https://www.google.com/maps/search/hospital+near+me", "_blank")}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Hospitals Near Me
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open("https://www.google.com/maps/search/urgent+care+near+me", "_blank")}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Urgent Care Near Me
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open("https://www.google.com/maps/search/pharmacy+near+me", "_blank")}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Pharmacy Near Me
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Crisis & Mental Health Hotlines
            </CardTitle>
            <CardDescription>Free, confidential support — you are not alone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {crisisHotlines.map((line, idx) => (
              <div key={idx} className="flex items-start justify-between p-3 rounded-lg bg-accent gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{line.name}</p>
                  <p className="text-xs text-muted-foreground">{line.country}</p>
                  <p className="text-primary font-bold text-sm mt-1">{line.contact}</p>
                </div>
                <button
                  onClick={() => handleCopyNumber(line.contact, line.name)}
                  className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors flex-shrink-0"
                  title="Copy"
                >
                  {copiedNumber === line.contact
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <Copy className="w-4 h-4 text-muted-foreground" />
                  }
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* REMINDERS */}
      <Card className="bg-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Important Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {reminders.map((r, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Emergency;
