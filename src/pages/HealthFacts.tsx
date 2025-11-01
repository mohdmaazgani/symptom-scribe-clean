import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, BookOpen, Heart, Brain, Dna } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HealthFact {
  category: string;
  fact: string;
  icon: typeof Heart;
  color: string;
}

const HealthFacts = () => {
  const [currentFact, setCurrentFact] = useState<HealthFact | null>(null);
  const [factHistory, setFactHistory] = useState<HealthFact[]>([]);

  const healthFacts: HealthFact[] = [
    {
      category: "Cardiovascular",
      fact: "Your heart beats about 100,000 times per day, pumping approximately 2,000 gallons of blood throughout your body.",
      icon: Heart,
      color: "from-red-500 to-pink-500"
    },
    {
      category: "Neuroscience",
      fact: "The human brain contains approximately 86 billion neurons, and each neuron can form thousands of connections with other neurons.",
      icon: Brain,
      color: "from-purple-500 to-indigo-500"
    },
    {
      category: "Genetics",
      fact: "Humans share about 99.9% of their DNA with each other, but share 60% with bananas and 98.8% with chimpanzees.",
      icon: Dna,
      color: "from-blue-500 to-cyan-500"
    },
    {
      category: "Immunology",
      fact: "Your immune system produces about 25 million new cells every second to replace dying cells and fight infections.",
      icon: Heart,
      color: "from-green-500 to-emerald-500"
    },
    {
      category: "Anatomy",
      fact: "The smallest bone in your body is in your ear (the stapes), measuring only 2.8mm, while the largest is the femur in your thigh.",
      icon: BookOpen,
      color: "from-orange-500 to-yellow-500"
    },
    {
      category: "Metabolism",
      fact: "Your liver performs over 500 different functions, including filtering over 1.4 liters of blood every minute.",
      icon: Heart,
      color: "from-teal-500 to-green-500"
    },
    {
      category: "Respiratory",
      fact: "The surface area of your lungs is approximately 70 square meters - about the size of a tennis court!",
      icon: Brain,
      color: "from-sky-500 to-blue-500"
    },
    {
      category: "Microbiome",
      fact: "Your body contains more bacterial cells than human cells - about 38 trillion bacteria compared to 30 trillion human cells.",
      icon: Dna,
      color: "from-violet-500 to-purple-500"
    },
    {
      category: "Sleep Science",
      fact: "During REM sleep, your brain is as active as when you're awake. This is when most dreaming occurs and memories are consolidated.",
      icon: Brain,
      color: "from-indigo-500 to-blue-500"
    },
    {
      category: "Nutrition",
      fact: "Your body can produce 11 of the 20 amino acids it needs. The remaining 9 'essential amino acids' must come from your diet.",
      icon: Heart,
      color: "from-lime-500 to-green-500"
    },
    {
      category: "Vision",
      fact: "Your eyes can distinguish approximately 10 million different colors and can detect a single photon of light in complete darkness.",
      icon: BookOpen,
      color: "from-amber-500 to-orange-500"
    },
    {
      category: "Bone Health",
      fact: "Your bones are continuously being broken down and rebuilt. You get a completely new skeleton approximately every 10 years.",
      icon: Dna,
      color: "from-stone-500 to-gray-500"
    },
    {
      category: "Hydration",
      fact: "Water makes up about 60% of your body weight. Your brain and heart are composed of 73% water, and your lungs are about 83% water.",
      icon: Heart,
      color: "from-cyan-500 to-blue-500"
    },
    {
      category: "Mental Health",
      fact: "Regular exercise can be as effective as antidepressants for treating mild to moderate depression, thanks to endorphin release.",
      icon: Brain,
      color: "from-rose-500 to-pink-500"
    },
    {
      category: "Recent Discovery",
      fact: "Scientists recently discovered the interstitium - a network of fluid-filled spaces in tissues that may be the body's largest organ.",
      icon: Sparkles,
      color: "from-fuchsia-500 to-purple-500"
    },
    {
      category: "COVID-19",
      fact: "Long COVID can affect multiple organ systems. Recent research shows symptoms may persist due to viral reservoirs and immune dysregulation.",
      icon: Heart,
      color: "from-red-500 to-rose-500"
    },
    {
      category: "Cancer Research",
      fact: "mRNA technology (like in COVID vaccines) is now being tested for cancer treatment, teaching immune cells to recognize cancer cells.",
      icon: Dna,
      color: "from-emerald-500 to-teal-500"
    },
    {
      category: "AI in Medicine",
      fact: "AI can now detect certain cancers earlier than human doctors by analyzing medical images with over 95% accuracy.",
      icon: Brain,
      color: "from-blue-500 to-indigo-500"
    }
  ];

  const getRandomFact = () => {
    const randomIndex = Math.floor(Math.random() * healthFacts.length);
    const fact = healthFacts[randomIndex];
    setCurrentFact(fact);
    setFactHistory([fact, ...factHistory.slice(0, 9)]);
  };

  useEffect(() => {
    getRandomFact();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          Did You Know? Health Facts
        </h1>
        <p className="text-muted-foreground mt-2">
          Fascinating insights about the human body and latest health discoveries
        </p>
      </div>

      {currentFact && (
        <Card className="border-2 bg-gradient-to-br from-background to-accent/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Badge className={`bg-gradient-to-r ${currentFact.color} text-white border-0`}>
                  {currentFact.category}
                </Badge>
                <CardTitle className="text-2xl">Today's Health Fact</CardTitle>
              </div>
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentFact.color} flex items-center justify-center`}>
                <currentFact.icon className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg leading-relaxed text-foreground">
              {currentFact.fact}
            </p>
            <Button onClick={getRandomFact} className="w-full gap-2">
              <RefreshCw className="w-4 h-4" />
              Show Me Another Fact
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-blue-500" />
              Body Facts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Learn about anatomy, physiology, and how your body works
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Brain & Mind
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Discover neuroscience and mental health insights
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-500" />
              Latest Research
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Stay updated with cutting-edge medical discoveries
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Recently Viewed Facts
          </CardTitle>
          <CardDescription>Your fact exploration history</CardDescription>
        </CardHeader>
        <CardContent>
          {factHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No facts viewed yet. Click "Show Me Another Fact" to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {factHistory.map((fact, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${fact.color} flex items-center justify-center flex-shrink-0`}>
                      <fact.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">
                        {fact.category}
                      </Badge>
                      <p className="text-sm text-foreground">{fact.fact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthFacts;
