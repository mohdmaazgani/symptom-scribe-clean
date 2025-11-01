import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Award, Trophy, Target, Lightbulb, Puzzle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GameScore {
  game: string;
  score: number;
  timestamp: Date;
}

const BrainGames = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [memoryCards, setMemoryCards] = useState<number[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);
  const [mathQuestion, setMathQuestion] = useState({ num1: 0, num2: 0, answer: 0 });
  const [mathScore, setMathScore] = useState(0);
  const [wordSequence, setWordSequence] = useState<string[]>([]);
  const [userSequence, setUserSequence] = useState<string[]>([]);
  const { toast } = useToast();

  const healthWords = [
    "Heart", "Brain", "Vitamin", "Exercise", "Nutrition", "Sleep", 
    "Wellness", "Fitness", "Immune", "Cardio", "Protein", "Hydration"
  ];

  const startMemoryGame = () => {
    const cards = [...Array(8)].map((_, i) => i % 4);
    setMemoryCards(cards.sort(() => Math.random() - 0.5));
    setFlippedCards([]);
    setMatchedCards([]);
    setActiveGame("memory");
  };

  const startMathGame = () => {
    generateMathQuestion();
    setMathScore(0);
    setActiveGame("math");
  };

  const startWordGame = () => {
    const sequence = [];
    for (let i = 0; i < 5; i++) {
      sequence.push(healthWords[Math.floor(Math.random() * healthWords.length)]);
    }
    setWordSequence(sequence);
    setUserSequence([]);
    setActiveGame("word");
    
    toast({
      title: "Memorize these words!",
      description: "You have 10 seconds...",
    });

    setTimeout(() => {
      toast({
        title: "Time's up!",
        description: "Now recall the words in order",
      });
    }, 10000);
  };

  const generateMathQuestion = () => {
    const num1 = Math.floor(Math.random() * 50) + 10;
    const num2 = Math.floor(Math.random() * 50) + 10;
    setMathQuestion({ num1, num2, answer: 0 });
  };

  const handleCardClick = (index: number) => {
    if (flippedCards.length === 2 || flippedCards.includes(index) || matchedCards.includes(index)) {
      return;
    }

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (memoryCards[first] === memoryCards[second]) {
        setMatchedCards([...matchedCards, first, second]);
        setFlippedCards([]);
        
        if (matchedCards.length + 2 === memoryCards.length) {
          toast({
            title: "🎉 Congratulations!",
            description: "You've matched all pairs!",
          });
        }
      } else {
        setTimeout(() => setFlippedCards([]), 1000);
      }
    }
  };

  const checkMathAnswer = () => {
    const correct = mathQuestion.num1 + mathQuestion.num2;
    if (mathQuestion.answer === correct) {
      setMathScore(mathScore + 1);
      toast({
        title: "✓ Correct!",
        description: `Score: ${mathScore + 1}`,
      });
      generateMathQuestion();
    } else {
      toast({
        title: "✗ Incorrect",
        description: `The answer was ${correct}`,
        variant: "destructive",
      });
    }
  };

  const games = [
    {
      id: "memory",
      name: "Memory Match",
      icon: Brain,
      description: "Match pairs of health-themed cards to boost your memory",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "math",
      name: "Quick Math",
      icon: Target,
      description: "Solve mental math problems to sharpen your calculation skills",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "word",
      name: "Word Recall",
      icon: Lightbulb,
      description: "Memorize and recall health-related word sequences",
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "pattern",
      name: "Pattern Recognition",
      icon: Puzzle,
      description: "Identify patterns in health data visualizations (Coming Soon)",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          Brain Fitness Center
        </h1>
        <p className="text-muted-foreground mt-2">
          Exercise your mind with fun, health-themed cognitive games
        </p>
      </div>

      {!activeGame ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game) => {
            const Icon = game.icon;
            return (
              <Card 
                key={game.id}
                className="group hover:shadow-glow transition-all duration-300 cursor-pointer border-2"
                onClick={() => {
                  if (game.id === "memory") startMemoryGame();
                  else if (game.id === "math") startMathGame();
                  else if (game.id === "word") startWordGame();
                }}
              >
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{game.name}</CardTitle>
                  <CardDescription>{game.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full"
                    disabled={game.id === "pattern"}
                  >
                    {game.id === "pattern" ? "Coming Soon" : "Play Now"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : activeGame === "memory" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Memory Match Game</span>
              <Button variant="outline" onClick={() => setActiveGame(null)}>
                Exit Game
              </Button>
            </CardTitle>
            <CardDescription>
              Matched: {matchedCards.length / 2} / {memoryCards.length / 2} pairs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {memoryCards.map((card, index) => (
                <div
                  key={index}
                  onClick={() => handleCardClick(index)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-4xl font-bold cursor-pointer transition-all ${
                    flippedCards.includes(index) || matchedCards.includes(index)
                      ? "bg-gradient-to-br from-primary to-primary-glow text-white rotate-0"
                      : "bg-muted hover:bg-accent rotate-180"
                  }`}
                >
                  {(flippedCards.includes(index) || matchedCards.includes(index)) && (
                    <span>{["🫀", "🧠", "💊", "🏃"][card]}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : activeGame === "math" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Quick Math Challenge</span>
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span className="font-bold">{mathScore}</span>
                </div>
                <Button variant="outline" onClick={() => setActiveGame(null)}>
                  Exit Game
                </Button>
              </div>
            </CardTitle>
            <CardDescription>Solve as many problems as you can!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="text-5xl font-bold text-foreground">
                {mathQuestion.num1} + {mathQuestion.num2} = ?
              </div>
              <div className="flex gap-4 items-center justify-center max-w-md mx-auto">
                <input
                  type="number"
                  value={mathQuestion.answer || ""}
                  onChange={(e) => setMathQuestion({ ...mathQuestion, answer: parseInt(e.target.value) || 0 })}
                  onKeyPress={(e) => e.key === "Enter" && checkMathAnswer()}
                  className="flex-1 px-4 py-3 text-2xl text-center border-2 border-border rounded-xl bg-background focus:outline-none focus:border-primary"
                  placeholder="?"
                  autoFocus
                />
                <Button onClick={checkMathAnswer} size="lg" className="px-8">
                  Check
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : activeGame === "word" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Word Recall Challenge</span>
              <Button variant="outline" onClick={() => setActiveGame(null)}>
                Exit Game
              </Button>
            </CardTitle>
            <CardDescription>Memorize the words, then recall them in order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-6 bg-accent rounded-xl">
                <h3 className="text-lg font-semibold mb-4">Words to memorize:</h3>
                <div className="flex flex-wrap gap-3">
                  {wordSequence.map((word, idx) => (
                    <div
                      key={idx}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-lg"
                    >
                      {word}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-muted rounded-xl">
                <h3 className="text-lg font-semibold mb-4">Available words:</h3>
                <div className="flex flex-wrap gap-2">
                  {healthWords.map((word, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      onClick={() => {
                        if (userSequence.length < wordSequence.length) {
                          setUserSequence([...userSequence, word]);
                        }
                      }}
                      disabled={userSequence.includes(word)}
                    >
                      {word}
                    </Button>
                  ))}
                </div>
              </div>
              {userSequence.length > 0 && (
                <div className="p-6 bg-accent rounded-xl">
                  <h3 className="text-lg font-semibold mb-4">Your sequence:</h3>
                  <div className="flex flex-wrap gap-3">
                    {userSequence.map((word, idx) => (
                      <div
                        key={idx}
                        className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold"
                      >
                        {word}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    const correct = JSON.stringify(wordSequence) === JSON.stringify(userSequence);
                    toast({
                      title: correct ? "🎉 Perfect!" : "❌ Not quite",
                      description: correct 
                        ? "You recalled all words correctly!" 
                        : "Try again or start a new game",
                      variant: correct ? "default" : "destructive",
                    });
                  }}
                  disabled={userSequence.length !== wordSequence.length}
                  className="flex-1"
                >
                  Check Answer
                </Button>
                <Button variant="outline" onClick={() => setUserSequence([])}>
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Benefits of Brain Training
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Improves memory and cognitive function</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Enhances problem-solving abilities</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Boosts concentration and focus</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>May help prevent cognitive decline</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrainGames;
