import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles, RefreshCw, BookOpen, Heart, Brain,
  Dna, ExternalLink, Share2, ThumbsUp, Bookmark
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showInfo } from "@/lib/toast-helpers";

interface HealthFact {
  id: number;
  category: string;
  emoji: string;
  hook: string;        // the short punchy headline
  fact: string;        // 1–2 sentences, surprising and specific
  mindBlown: string;   // the "wait, WHAT?" follow-up line
  wikiTopic: string;   // Wikipedia article slug for "read more"
  color: string;
}

const FACTS: HealthFact[] = [
  {
    id: 1,
    category: "Your Brain",
    emoji: "🧠",
    hook: "Your brain eats itself while you sleep",
    fact: "Every night during deep sleep, your brain's glial cells physically shrink to let cerebrospinal fluid flush out toxic waste — including the amyloid plaques linked to Alzheimer's. It's essentially running a dishwasher cycle on itself.",
    mindBlown: "People who consistently sleep less than 6 hours have up to 4× more amyloid buildup by age 60.",
    wikiTopic: "Glymphatic_system",
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: 2,
    category: "Your Gut",
    emoji: "🦠",
    hook: "You are 57% bacteria by cell count",
    fact: "Your body has roughly 30 trillion human cells — but 38 trillion bacterial cells. The bacteria in your gut collectively weigh about 1.5 kg, which is heavier than the average human brain.",
    mindBlown: "Your gut bacteria produce about 90% of your body's serotonin — the 'happiness chemical' most people think comes from the brain.",
    wikiTopic: "Gut_microbiota",
    color: "from-green-500 to-teal-500",
  },
  {
    id: 3,
    category: "Your Heart",
    emoji: "❤️",
    hook: "Your heart creates enough pressure to squirt blood 9 metres",
    fact: "The left ventricle generates enough force with each beat to project blood about 9 metres into the air if the aorta were open. Over a lifetime, your heart beats around 3 billion times — without a single break.",
    mindBlown: "The heart can keep beating even when disconnected from the body, as long as it has oxygen — it has its own electrical system.",
    wikiTopic: "Cardiac_muscle",
    color: "from-red-500 to-pink-500",
  },
  {
    id: 4,
    category: "Your DNA",
    emoji: "🧬",
    hook: "If your DNA were uncoiled, it would stretch to Pluto and back",
    fact: "Every single one of your ~37 trillion cells contains about 2 metres of DNA tightly coiled inside a nucleus 6 micrometres wide. All the DNA in your body, stretched end to end, would cover the distance to Pluto twice over.",
    mindBlown: "Yet 8% of your entire genome is made up of ancient viral DNA from infections your ancestors survived millions of years ago.",
    wikiTopic: "Human_genome",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: 5,
    category: "Your Eyes",
    emoji: "👁️",
    hook: "Your eyes can detect a single photon of light",
    fact: "Human eyes are sensitive enough to detect a single photon — the smallest possible unit of light. On a perfectly dark night, you could theoretically see a candle flame from 48 kilometres away.",
    mindBlown: "Your eye moves about 100,000 times a day. To give your leg muscles the same workout, you'd need to walk 80 km.",
    wikiTopic: "Photoreceptor_cell",
    color: "from-amber-500 to-yellow-500",
  },
  {
    id: 6,
    category: "Your Bones",
    emoji: "🦴",
    hook: "Bone is stronger than reinforced concrete — pound for pound",
    fact: "Cubic inch for cubic inch, compact bone tissue can withstand forces of up to 170 MPa — stronger than reinforced concrete (about 40 MPa). Yet it's lightweight because of its hollow, honeycomb-like internal structure.",
    mindBlown: "You get a completely new skeleton roughly every 10 years. Your bones are constantly being demolished by osteoclasts and rebuilt by osteoblasts in a process called remodelling.",
    wikiTopic: "Bone_remodeling",
    color: "from-stone-400 to-zinc-500",
  },
  {
    id: 7,
    category: "Your Nerves",
    emoji: "⚡",
    hook: "Pain signals travel slower than you'd think — 1 m/s for dull ache",
    fact: "Sharp pain travels at about 20 m/s, but slow throbbing pain crawls along C-fibres at just 0.5–2 m/s. That's why you feel a sharp sting first, then the dull ache arrives a second later — they're literally different signals on different fibres.",
    mindBlown: "Your fastest nerve signals (touch, proprioception) travel at 120 m/s — roughly the speed of a fighter jet.",
    wikiTopic: "Nerve_conduction_velocity",
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: 8,
    category: "Your Lungs",
    emoji: "🫁",
    hook: "Your lungs have the surface area of a tennis court",
    fact: "Unfolded, the tiny air sacs (alveoli) in your lungs would cover about 70 square metres — roughly the size of a tennis court. This massive area lets your body exchange oxygen and CO₂ across hundreds of millions of tiny membranes every second.",
    mindBlown: "You breathe around 22,000 times a day, and each breath moves air through about 2,400 km of airways — roughly the distance from London to Cairo.",
    wikiTopic: "Pulmonary_alveolus",
    color: "from-sky-500 to-blue-500",
  },
  {
    id: 9,
    category: "Your Liver",
    emoji: "🫀",
    hook: "Your liver can regrow from just 25% of itself",
    fact: "The liver is the only internal organ that can fully regenerate. In living donor transplants, surgeons remove up to 75% of a donor's liver — and both the donor's remaining liver and the transplanted portion regrow to full size within 8 weeks.",
    mindBlown: "Your liver performs over 500 different chemical functions simultaneously, including making all of your blood-clotting proteins and filtering 1.4 litres of blood every single minute.",
    wikiTopic: "Liver_regeneration",
    color: "from-rose-500 to-red-500",
  },
  {
    id: 10,
    category: "Your Skin",
    emoji: "🧬",
    hook: "You shed and regrow your entire outer skin every 2–4 weeks",
    fact: "You lose about 30,000–40,000 skin cells every hour. By the time you finish reading this fact, you'll have shed several thousand cells. About 1.5 kg of dead skin cells flake off your body every year.",
    mindBlown: "The dust in your home is largely made of your own shed skin. Dust mites eat it — so your house is essentially a farm for microscopic creatures feeding off you.",
    wikiTopic: "Skin#Layers",
    color: "from-orange-400 to-amber-500",
  },
  {
    id: 11,
    category: "Your Immune System",
    emoji: "🛡️",
    hook: "Your immune system has memory going back decades",
    fact: "Memory B cells from infections or vaccines can survive for over 60 years inside your bone marrow — some studies have found antibody-producing cells still active in elderly patients from diseases they caught in childhood.",
    mindBlown: "When a cancer tumour is detected early by immune cells, it can be held in a silent stand-off for years — neither growing nor being eliminated — in a state called 'immune equilibrium'.",
    wikiTopic: "Immunological_memory",
    color: "from-emerald-500 to-green-600",
  },
  {
    id: 12,
    category: "Sleep",
    emoji: "😴",
    hook: "You are literally paralysed every night — on purpose",
    fact: "During REM sleep, your brainstem actively sends signals to paralyse your voluntary muscles. This is called REM atonia and it stops you acting out your dreams. People with REM sleep behaviour disorder lack this mechanism and physically punch, kick and shout in their sleep.",
    mindBlown: "Your brain during REM sleep shows electrical activity almost identical to when you are wide awake — the only reliable difference is the paralysis signal.",
    wikiTopic: "REM_sleep_behavior_disorder",
    color: "from-indigo-500 to-violet-500",
  },
  {
    id: 13,
    category: "Exercise",
    emoji: "🏃",
    hook: "Exercise literally grows new brain cells",
    fact: "Aerobic exercise triggers the release of BDNF (Brain-Derived Neurotrophic Factor), which stimulates neurogenesis — the birth of brand new neurons — primarily in the hippocampus, the region responsible for memory and learning.",
    mindBlown: "Just 20 minutes of moderate exercise produces measurable improvements in memory and problem-solving for 2–3 hours afterward. It's more reliably effective than most nootropic supplements.",
    wikiTopic: "Neurobiological_effects_of_physical_exercise",
    color: "from-lime-500 to-green-500",
  },
  {
    id: 14,
    category: "Pain & Pleasure",
    emoji: "🎯",
    hook: "Swearing actually reduces pain — scientifically proven",
    fact: "A 2009 study at Keele University found that participants who swore while holding their hand in ice-cold water could endure the pain significantly longer than those who repeated a neutral word. Swearing triggers an emotional response that activates the body's fight-or-flight pain-dampening system.",
    mindBlown: "However, people who swear habitually get less pain relief from it — the effect diminishes with overuse, just like a drug tolerance.",
    wikiTopic: "Hypoalgesia",
    color: "from-fuchsia-500 to-pink-500",
  },
  {
    id: 15,
    category: "Genetics",
    emoji: "🧪",
    hook: "You share 60% of your DNA with a banana",
    fact: "Humans share approximately 60% of their genes with bananas, 85% with mice, and 98.8% with chimpanzees. The genes we share with bananas are largely the ones responsible for basic cellular machinery — like how cells divide and produce energy.",
    mindBlown: "Two unrelated humans share 99.9% of their DNA. The entire genetic difference between any two people on Earth fits into about 3 million base pairs — out of 3 billion.",
    wikiTopic: "Human_genetic_variation",
    color: "from-yellow-400 to-lime-500",
  },
  {
    id: 16,
    category: "Your Nose",
    emoji: "👃",
    hook: "You can smell about 1 trillion different odours",
    fact: "A 2014 study in Science found humans can discriminate at least 1 trillion distinct smells — far exceeding the previously assumed 10,000. Your olfactory system has around 400 types of smell receptors that combine like a code to identify virtually unlimited combinations.",
    mindBlown: "Smell is the only sense that bypasses the thalamus and connects directly to the amygdala and hippocampus — which is why a smell can trigger a vivid memory or strong emotion almost instantaneously.",
    wikiTopic: "Olfactory_system",
    color: "from-teal-400 to-cyan-500",
  },
  {
    id: 17,
    category: "Placebo Effect",
    emoji: "💊",
    hook: "Fake surgery works just as well as real surgery — for some conditions",
    fact: "Multiple randomised controlled trials have found that sham knee surgery (where surgeons make incisions but do nothing) produces the same pain relief and functional improvement as actual arthroscopic surgery for osteoarthritis — even two years later.",
    mindBlown: "The placebo effect works even when patients are told they're taking a placebo. This 'open-label placebo' still reduces IBS symptoms and chronic back pain — the brain doesn't need to be deceived to respond.",
    wikiTopic: "Placebo",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: 18,
    category: "Your Blood",
    emoji: "🩸",
    hook: "Red blood cells have no nucleus — and live only 120 days",
    fact: "Mature red blood cells eject their nucleus during development to maximise space for haemoglobin. This means they can carry ~270 million haemoglobin molecules per cell — but it also means they cannot repair themselves, so they die after ~120 days and are replaced.",
    mindBlown: "Your bone marrow produces about 2 million new red blood cells every second to keep up with the die-off. In one day, you make roughly 200 billion new red blood cells.",
    wikiTopic: "Red_blood_cell",
    color: "from-red-500 to-rose-600",
  },
  {
    id: 19,
    category: "Temperature",
    emoji: "🌡️",
    hook: "Normal body temperature is no longer 37°C",
    fact: "A landmark 2020 Stanford study analysed 677,000 temperature measurements and found the average human body temperature has been declining since the 1800s — and now sits closer to 36.6°C. The original 37°C was measured in a Prussian study in 1851 on a population that was chronically inflamed from widespread infections.",
    mindBlown: "Researchers believe our lower temperatures today reflect reduced systemic inflammation — a result of modern medicine eliminating chronic bacterial infections that kept our immune systems perpetually activated.",
    wikiTopic: "Normal_human_body_temperature",
    color: "from-orange-500 to-red-500",
  },
  {
    id: 20,
    category: "Your Microbiome",
    emoji: "🔬",
    hook: "Bacteria in your gut talk directly to your brain — via a nerve highway",
    fact: "The vagus nerve acts as a direct two-way communication cable between your gut and brain. Gut bacteria produce neurotransmitters (including GABA and serotonin precursors) that travel up this nerve and influence mood, anxiety, and even decision-making.",
    mindBlown: "Germ-free mice (raised with no gut bacteria) show dramatically higher anxiety and stress responses. When given normal gut bacteria, their behaviour normalises — suggesting gut flora actively shape personality-level traits.",
    wikiTopic: "Gut%E2%80%93brain_axis",
    color: "from-green-500 to-emerald-600",
  },
];

const getCategoryIcon = (category: string) => {
  const c = category.toLowerCase();
  if (c.includes("brain") || c.includes("nerve") || c.includes("sleep") || c.includes("pain")) return Brain;
  if (c.includes("dna") || c.includes("gene") || c.includes("micro") || c.includes("blood") || c.includes("skin")) return Dna;
  if (c.includes("research") || c.includes("placebo") || c.includes("nose") || c.includes("temp")) return BookOpen;
  if (c.includes("exercise") || c.includes("lung") || c.includes("liver") || c.includes("bone") || c.includes("immune")) return Sparkles;
  return Heart;
};

const HealthFacts = () => {
  const [currentFact, setCurrentFact] = useState<HealthFact | null>(null);
  const [factHistory, setFactHistory] = useState<HealthFact[]>([]);
  const hasInitialized = useRef(false);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState<Set<number>>(new Set());

  // Track shown IDs so no fact repeats until all 20 are seen
  const shownIds = useRef<Set<number>>(new Set());

  const getNextFact = (isInitial = false) => {
    if (shownIds.current.size >= FACTS.length) {
      shownIds.current.clear();
      if (!isInitial) showInfo("You've seen all facts!", "Reshuffling for a fresh round 🔄");
    }

    const remaining = FACTS.filter((f) => !shownIds.current.has(f.id));
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    shownIds.current.add(pick.id);

    setCurrentFact(pick);
    setFactHistory((prev) => {
      if (prev[0]?.id === pick.id) return prev;
      return [pick, ...prev].slice(0, 10);
    });

    if (!isInitial) showSuccess("New fact!", pick.hook);
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    getNextFact(true);
    showInfo("Welcome to Health Facts!", "Weird, surprising, and 100% real 🤯");
  }, []);

  const handleLike = (id: number) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = (id: number) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showInfo("Removed", "Fact unsaved");
      } else {
        next.add(id);
        showSuccess("Saved!", "Fact added to your saved list");
      }
      return next;
    });
  };

  const handleShare = (fact: HealthFact) => {
    const text = `🤯 Did you know?\n\n"${fact.hook}"\n\n${fact.fact}\n\nvia Smart Health Tracker`;
    if (navigator.share) {
      navigator.share({ title: fact.hook, text });
    } else {
      navigator.clipboard.writeText(text);
      showSuccess("Copied!", "Fact copied to clipboard — share it!");
    }
  };

  const savedFacts = FACTS.filter((f) => saved.has(f.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          Did You Know?
        </h1>
        <p className="text-muted-foreground mt-1">
          Weird, surprising health facts — things your textbook never told you
        </p>
      </div>

      {/* Current Fact Card */}
      {currentFact && (
        <Card className={`border-2 bg-gradient-to-br from-background to-accent/20 overflow-hidden`}>
          {/* Coloured top bar */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${currentFact.color}`} />

          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <Badge className={`bg-gradient-to-r ${currentFact.color} text-white border-0 text-xs`}>
                  {currentFact.emoji} {currentFact.category}
                </Badge>
                <CardTitle className="text-xl leading-snug">{currentFact.hook}</CardTitle>
              </div>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentFact.color} flex items-center justify-center flex-shrink-0 text-2xl`}>
                {currentFact.emoji}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* The fact */}
            <p className="text-base leading-relaxed text-foreground">{currentFact.fact}</p>

            {/* Mind-blown callout */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-lg flex-shrink-0">🤯</span>
              <p className="text-sm text-foreground leading-relaxed">{currentFact.mindBlown}</p>
            </div>

            {/* Actions row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className={`gap-1.5 ${liked.has(currentFact.id) ? "text-red-500 border-red-500" : ""}`}
                onClick={() => handleLike(currentFact.id)}
              >
                <ThumbsUp className="w-4 h-4" />
                {liked.has(currentFact.id) ? "Liked" : "Like"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className={`gap-1.5 ${saved.has(currentFact.id) ? "text-primary border-primary" : ""}`}
                onClick={() => handleSave(currentFact.id)}
              >
                <Bookmark className="w-4 h-4" />
                {saved.has(currentFact.id) ? "Saved" : "Save"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => handleShare(currentFact)}
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>

              <a
                href={`https://en.wikipedia.org/wiki/${currentFact.wikiTopic}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto"
              >
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Read more
                </Button>
              </a>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{FACTS.length - shownIds.current.size} facts left this round</span>
              <span>{shownIds.current.size} / {FACTS.length} seen</span>
            </div>

            <Button onClick={() => getNextFact(false)} className="w-full gap-2">
              <RefreshCw className="w-4 h-4" />
              Next Fact
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Saved Facts */}
      {savedFacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bookmark className="w-5 h-5 text-primary" />
              Saved Facts ({savedFacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {savedFacts.map((fact) => (
              <div key={fact.id} className="p-3 rounded-lg border border-border bg-accent/30">
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">{fact.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{fact.hook}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{fact.fact}</p>
                  </div>
                  <button onClick={() => handleSave(fact.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                    ×
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Recently Viewed
          </CardTitle>
          <CardDescription>
            {FACTS.length} unique facts — no repeats until you've seen them all
          </CardDescription>
        </CardHeader>
        <CardContent>
          {factHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Hit "Next Fact" to start exploring!
            </p>
          ) : (
            <div className="space-y-3">
              {factHistory.map((fact, index) => {
                const FactIcon = getCategoryIcon(fact.category);
                return (
                  <div
                    key={`${fact.id}-${index}`}
                    className="p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setCurrentFact(fact);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${fact.color} flex items-center justify-center flex-shrink-0 text-base`}>
                        {fact.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fact.hook}</p>
                        <p className="text-xs text-muted-foreground">{fact.category}</p>
                      </div>
                      {liked.has(fact.id) && <ThumbsUp className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                      {saved.has(fact.id) && <Bookmark className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthFacts;
