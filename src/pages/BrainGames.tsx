import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Award, Trophy, Target, Lightbulb, Puzzle, Clock, Activity, Heart, Moon, Droplet, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { showSuccess, showError, showInfo, showWarning } from "@/lib/toast-helpers";

interface TrendQuestion {
  id: number;
  metricType: "steps" | "heart_rate" | "sleep" | "water";
  values: number[];
  pattern: string;
  patternDescription: string;
  correctAnswer: number;
  options: number[];
}

const BrainGames = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [memoryCards, setMemoryCards] = useState<number[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);
  const [mathQuestion, setMathQuestion] = useState({ num1: 0, num2: 0, answer: "" });
  const [mathScore, setMathScore] = useState(0);
  const [wordSequence, setWordSequence] = useState<string[]>([]);
  const [userSequence, setUserSequence] = useState<{ word: string; index: number }[]>([]);
  const [wordPhase, setWordPhase] = useState<"memorize" | "recall">("memorize");
  const [timeLeft, setTimeLeft] = useState(10);
  
  // Pattern Recognition Game States
  const [patternScore, setPatternScore] = useState(0);
  const [patternStreak, setPatternStreak] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<TrendQuestion | null>(null);
  const [showPatternFeedback, setShowPatternFeedback] = useState(false);
  const [isPatternCorrect, setIsPatternCorrect] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const TOTAL_QUESTIONS = 10;
  
  const { toast } = useToast();

  const healthWords = [
    "Heart", "Brain", "Vitamin", "Exercise", "Nutrition", "Sleep",
    "Wellness", "Fitness", "Immune", "Cardio", "Protein", "Hydration"
  ];

  // Generate a new trend question
  const generateTrendQuestion = (): TrendQuestion => {
    const metricTypes = ["steps", "heart_rate", "sleep", "water"] as const;
    const metricType = metricTypes[Math.floor(Math.random() * metricTypes.length)];
    
    // Define patterns
    const patterns = [
      { 
        name: "increasing", 
        getValue: (i: number, start: number) => start + (i * 5), 
        step: 5,
        description: "Increasing by 5 each day"
      },
      { 
        name: "increasing_fast", 
        getValue: (i: number, start: number) => start + (i * 10), 
        step: 10,
        description: "Increasing by 10 each day"
      },
      { 
        name: "decreasing", 
        getValue: (i: number, start: number) => start - (i * 5), 
        step: 5,
        description: "Decreasing by 5 each day"
      },
      { 
        name: "decreasing_fast", 
        getValue: (i: number, start: number) => start - (i * 10), 
        step: 10,
        description: "Decreasing by 10 each day"
      },
      { 
        name: "multiply", 
        getValue: (i: number, start: number) => start * Math.pow(2, i), 
        step: "x2",
        description: "Doubling each day"
      },
      { 
        name: "alternating", 
        getValue: (i: number, start: number) => i % 2 === 0 ? start : start + 15, 
        step: 15,
        description: "Alternating between two values"
      }
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    // Set start value based on metric type
    let startValue = 0;
    switch(metricType) {
      case "steps": startValue = Math.floor(Math.random() * 3000) + 4000; break;
      case "heart_rate": startValue = Math.floor(Math.random() * 30) + 60; break;
      case "sleep": startValue = Math.floor(Math.random() * 3) + 5; break;
      case "water": startValue = Math.floor(Math.random() * 4) + 4; break;
    }
    
    // Generate 3 values for days 1-3
    const values = [];
    for (let i = 0; i < 3; i++) {
      let val = pattern.getValue(i, startValue);
      // Round to 1 decimal for sleep/water, integer for others
      if (metricType === "sleep" || metricType === "water") {
        val = Math.round(val * 10) / 10;
      } else {
        val = Math.round(val);
      }
      values.push(val);
    }
    
    // Calculate day 4 value
    let correctAnswer = pattern.getValue(3, startValue);
    if (metricType === "sleep" || metricType === "water") {
      correctAnswer = Math.round(correctAnswer * 10) / 10;
    } else {
      correctAnswer = Math.round(correctAnswer);
    }
    
    // Generate wrong options
    const options = [correctAnswer];
    while (options.length < 4) {
      let offset = 0;
      if (pattern.name.includes("increasing")) {
        offset = Math.floor(Math.random() * 15) + 5;
        const wrongOption = correctAnswer - offset;
        if (!options.includes(wrongOption) && wrongOption > 0) {
          options.push(wrongOption);
        }
      } else if (pattern.name.includes("decreasing")) {
        offset = Math.floor(Math.random() * 15) + 5;
        const wrongOption = correctAnswer + offset;
        if (!options.includes(wrongOption)) {
          options.push(wrongOption);
        }
      } else {
        offset = Math.floor(Math.random() * 20) + 10;
        const wrongOption = correctAnswer + (Math.random() > 0.5 ? offset : -offset);
        if (!options.includes(wrongOption) && wrongOption > 0) {
          options.push(wrongOption);
        }
      }
    }
    
    return {
      id: Date.now(),
      metricType,
      values,
      pattern: pattern.name,
      patternDescription: pattern.description,
      correctAnswer,
      options: options.sort(() => Math.random() - 0.5)
    };
  };

  const startPatternGame = () => {
    setPatternScore(0);
    setPatternStreak(0);
    setQuestionsAnswered(0);
    setGameCompleted(false);
    const question = generateTrendQuestion();
    setCurrentQuestion(question);
    setShowPatternFeedback(false);
    setActiveGame("pattern");
    showSuccess("Pattern Recognition Started!", "Complete the health trend by finding Day 4 value");
  };

  const handlePatternAnswer = (answer: number) => {
    if (showPatternFeedback || !currentQuestion || gameCompleted) return;
    
    const isCorrect = answer === currentQuestion.correctAnswer;
    setIsPatternCorrect(isCorrect);
    setShowPatternFeedback(true);
    const newQuestionsCount = questionsAnswered + 1;
    setQuestionsAnswered(newQuestionsCount);
    
    if (isCorrect) {
      const points = 10;
      const newScore = patternScore + points;
      const newStreak = patternStreak + 1;
      setPatternScore(newScore);
      setPatternStreak(newStreak);
      
      showSuccess("✓ Correct Trend!", `+${points} points! Streak: ${newStreak}`);
      
      toast({
        title: "✓ Correct!",
        description: `Day 4 value is ${currentQuestion.correctAnswer}`,
      });
    } else {
      setPatternStreak(0);
      showError("✗ Incorrect", `The correct trend was: ${currentQuestion.patternDescription}`);
      
      toast({
        title: "✗ Incorrect",
        description: `Day 4 should be ${currentQuestion.correctAnswer}. ${currentQuestion.patternDescription}`,
        variant: "destructive",
      });
    }
    
    // Check if game completed
    if (newQuestionsCount >= TOTAL_QUESTIONS) {
      setGameCompleted(true);
      showSuccess("🎉 Game Complete! 🎉", `Final Score: ${patternScore + (isCorrect ? 10 : 0)}/${TOTAL_QUESTIONS * 10}`);
      return;
    }
    
    // Load next question after delay
    setTimeout(() => {
      const nextQuestion = generateTrendQuestion();
      setCurrentQuestion(nextQuestion);
      setShowPatternFeedback(false);
    }, 2000);
  };

  const resetPatternGame = () => {
    setPatternScore(0);
    setPatternStreak(0);
    setQuestionsAnswered(0);
    setGameCompleted(false);
    const question = generateTrendQuestion();
    setCurrentQuestion(question);
    setShowPatternFeedback(false);
    showInfo("Game Restarted", "Try to beat your previous score!");
  };

  const getMetricIcon = (type: string) => {
    switch(type) {
      case "steps": return <Activity className="w-6 h-6 text-green-500" />;
      case "heart_rate": return <Heart className="w-6 h-6 text-red-500" />;
      case "sleep": return <Moon className="w-6 h-6 text-purple-500" />;
      case "water": return <Droplet className="w-6 h-6 text-blue-500" />;
      default: return <TrendingUp className="w-6 h-6 text-orange-500" />;
    }
  };

  const getMetricTitle = (type: string) => {
    switch(type) {
      case "steps": return "Daily Steps";
      case "heart_rate": return "Heart Rate (BPM)";
      case "sleep": return "Sleep (Hours)";
      case "water": return "Water Intake (Glasses)";
      default: return "Health Metric";
    }
  };

  const getMetricUnit = (type: string) => {
    switch(type) {
      case "steps": return "steps";
      case "heart_rate": return "BPM";
      case "sleep": return "hours";
      case "water": return "glasses";
      default: return "";
    }
  };

  const startMemoryGame = () => {
    const cards = [...Array(8)].map((_, i) => i % 4);
    setMemoryCards(cards.sort(() => Math.random() - 0.5));
    setFlippedCards([]);
    setMatchedCards([]);
    setActiveGame("memory");
    showSuccess("Memory Game Started!", "Match all the pairs to win");
  };

  const startMathGame = () => {
    generateMathQuestion();
    setMathScore(0);
    setActiveGame("math");
    showSuccess("Math Challenge Started!", "Solve as many problems as you can");
  };

  const startWordGame = () => {
    const sequence = [];
    for (let i = 0; i < 5; i++) {
      sequence.push(healthWords[Math.floor(Math.random() * healthWords.length)]);
    }

    setWordSequence(sequence);
    setUserSequence([]);
    setWordPhase("memorize");
    setTimeLeft(10);
    setActiveGame("word");

    showInfo("Memorize these words!", "You have 10 seconds...");

    setTimeout(() => {
      setWordPhase("recall");
      showWarning("Time's up!", "Now recall the words in order");
    }, 10000);
  };
  
  useEffect(() => {
    if (wordPhase !== "memorize" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [wordPhase, timeLeft]);

  const generateMathQuestion = () => {
    const num1 = Math.floor(Math.random() * 50) + 10;
    const num2 = Math.floor(Math.random() * 50) + 10;
    setMathQuestion({ num1, num2, answer: "" });
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
        
        showSuccess("Match Found!", `You matched a pair! (${matchedCards.length / 2 + 1}/${memoryCards.length / 2})`);

        if (matchedCards.length + 2 === memoryCards.length) {
          showSuccess("🎉 Congratulations! 🎉", "You've matched all pairs! Great memory!");
          toast({
            title: "🎉 Congratulations!",
            description: "You've matched all pairs!",
          });
        }
      } else {
        setTimeout(() => {
          showWarning("No match", "Try again!");
        }, 500);
        setTimeout(() => setFlippedCards([]), 1000);
      }
    }
  };

  const checkMathAnswer = () => {
    const correct = mathQuestion.num1 + mathQuestion.num2;
    const userAnswer = parseInt(mathQuestion.answer);
    if (userAnswer === correct) {
      const newScore = mathScore + 1;
      setMathScore(newScore);
      showSuccess("✓ Correct! ✓", `Score: ${newScore}`);
      toast({
        title: "✓ Correct!",
        description: `Score: ${newScore}`,
      });
      generateMathQuestion();
    } else {
      showError("✗ Incorrect", `The answer was ${correct}. Keep practicing!`);
      toast({
        title: "✗ Incorrect",
        description: `The answer was ${correct}`,
        variant: "destructive",
      });
      generateMathQuestion();
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
      description: "Solve mental math problems to sharpen your calculations",
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
      description: "Complete the health trend by finding the next day's value",
      color: "from-orange-500 to-red-500",
    },
  ];

  // Render Pattern Recognition Game
  const renderPatternGame = () => {
    if (gameCompleted) {
      const maxScore = TOTAL_QUESTIONS * 10;
      const percentage = (patternScore / maxScore) * 100;
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">🎉 Game Complete! 🎉</CardTitle>
            <CardDescription className="text-center">Great job spotting the trends!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="p-8 bg-gradient-to-br from-primary/10 to-primary-glow/10 rounded-xl">
              <Trophy className="w-16 h-16 mx-auto text-primary mb-4" />
              <p className="text-3xl font-bold mb-2">{patternScore} / {maxScore}</p>
              <p className="text-muted-foreground">Final Score</p>
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="mt-4 text-sm">
                {percentage >= 80 ? "🌟 Outstanding! Health trend expert!" :
                 percentage >= 60 ? "👍 Good job! Keep practicing!" :
                 "💪 Keep learning! Try again to improve!"}
              </p>
            </div>
            <div className="flex gap-4">
              <Button onClick={resetPatternGame} className="flex-1">
                Play Again
              </Button>
              <Button variant="outline" onClick={() => setActiveGame(null)} className="flex-1">
                Back to Games
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (!currentQuestion) return null;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Complete the Health Trend
            </span>
            <div className="flex gap-2 items-center flex-wrap">
              <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-lg">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="font-bold">{patternScore}</span>
              </div>
              <div className="flex items-center gap-2 bg-secondary/10 px-3 py-1 rounded-lg">
                <Target className="w-4 h-4 text-secondary" />
                <span className="font-bold">Streak: {patternStreak}</span>
              </div>
              <div className="flex items-center gap-2 bg-accent/10 px-3 py-1 rounded-lg">
                <Brain className="w-4 h-4 text-accent" />
                <span className="font-bold">Q{questionsAnswered + 1}/{TOTAL_QUESTIONS}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveGame(null)}>
                Exit Game
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Identify the pattern and find Day 4 value
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Data Visualization */}
          <div className="p-6 bg-accent/30 rounded-xl">
            <div className="flex items-center justify-center gap-2 mb-6">
              {getMetricIcon(currentQuestion.metricType)}
              <h3 className="text-lg font-semibold">{getMetricTitle(currentQuestion.metricType)}</h3>
            </div>
            
            {/* Bar Chart */}
            <div className="flex items-end justify-center gap-6 h-48 mb-6">
              {currentQuestion.values.map((value, index) => {
                let maxValue = 0;
                switch(currentQuestion.metricType) {
                  case "steps": maxValue = 15000; break;
                  case "heart_rate": maxValue = 150; break;
                  case "sleep": maxValue = 12; break;
                  case "water": maxValue = 10; break;
                }
                const height = (value / maxValue) * 120;
                return (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div 
                      className="w-16 bg-gradient-to-t from-primary to-primary-glow rounded-t-lg transition-all"
                      style={{ height: `${Math.max(40, height)}px` }}
                    />
                    <span className="text-xl font-bold">{value}</span>
                    <span className="text-xs text-muted-foreground">Day {index + 1}</span>
                  </div>
                );
              })}
              {/* Question Mark for Day 4 */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 bg-muted rounded-t-lg flex items-center justify-center" style={{ height: "80px" }}>
                  <span className="text-3xl text-muted-foreground">?</span>
                </div>
                <span className="text-xl font-bold text-muted-foreground">???</span>
                <span className="text-xs text-muted-foreground">Day 4</span>
              </div>
            </div>
            
            <p className="text-center text-sm text-muted-foreground">
              Look at the pattern from Day 1 → Day 2 → Day 3
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.options.map((option, idx) => (
              <Button
                key={idx}
                variant={showPatternFeedback && option === currentQuestion.correctAnswer ? "default" : "outline"}
                className="text-lg py-6"
                onClick={() => handlePatternAnswer(option)}
                disabled={showPatternFeedback}
              >
                {option} {getMetricUnit(currentQuestion.metricType)}
              </Button>
            ))}
          </div>

          {/* Feedback */}
          {showPatternFeedback && (
            <div className={`p-4 rounded-lg text-center ${isPatternCorrect ? "bg-green-500/10 border border-green-500" : "bg-red-500/10 border border-red-500"}`}>
              <p className={isPatternCorrect ? "text-green-600" : "text-red-600"}>
                {isPatternCorrect 
                  ? `✅ Correct! Day 4 should be ${currentQuestion.correctAnswer} ${getMetricUnit(currentQuestion.metricType)}` 
                  : `❌ Incorrect! The pattern was: ${currentQuestion.patternDescription}`}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {currentQuestion.patternDescription}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
//           <Brain className="w-8 h-8 text-primary" />
//           Brain Fitness Center
//         </h1>
//         <p className="text-muted-foreground mt-2">
//           Exercise your mind with fun, health-themed cognitive games
//         </p>
//       </div>

//       {!activeGame ? (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {games.map((game) => {
//             const Icon = game.icon;
//             return (
//               <Card
//                 key={game.id}
//                 className="group hover:shadow-glow transition-all duration-300 cursor-pointer border-2"
//                 onClick={() => {
//                   if (game.id === "memory") startMemoryGame();
//                   else if (game.id === "math") startMathGame();
//                   else if (game.id === "word") startWordGame();
//                   else if (game.id === "pattern") startPatternGame();
//                 }}
//               >
//                 <CardHeader>
//                   <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
//                     <Icon className="w-8 h-8 text-white" />
//                   </div>
//                   <CardTitle className="text-xl">{game.name}</CardTitle>
//                   <CardDescription>{game.description}</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <Button className="w-full">
//                     Play Now
//                   </Button>
//                 </CardContent>
//               </Card>
//             );
//           })}
//         </div>
//       ) : activeGame === "memory" ? (
//         // Memory Game UI (unchanged)
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center justify-between">
//               <span>Memory Match Game</span>
//               <div className="flex gap-2">
//                 <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
//                   <Trophy className="w-5 h-5 text-primary" />
//                   <span className="font-bold">{matchedCards.length / 2} / {memoryCards.length / 2} pairs</span>
//                 </div>
//                 <Button variant="outline" onClick={() => {
//                   setActiveGame(null);
//                   showInfo("Game Exited", "Come back anytime to play again!");
//                 }}>
//                   Exit Game
//                 </Button>
//               </div>
//             </CardTitle>
//             <CardDescription>
//               Matched: {matchedCards.length / 2} / {memoryCards.length / 2} pairs
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="grid grid-cols-4 gap-4">
//               {memoryCards.map((card, index) => (
//                 <div
//                   key={index}
//                   onClick={() => handleCardClick(index)}
//                   className={`aspect-square rounded-xl flex items-center justify-center text-4xl font-bold cursor-pointer transition-all ${flippedCards.includes(index) || matchedCards.includes(index)
//                     ? "bg-gradient-to-br from-primary to-primary-glow text-white rotate-0"
//                     : "bg-muted hover:bg-accent rotate-180"
//                     }`}
//                 >
//                   {(flippedCards.includes(index) || matchedCards.includes(index)) && (
//                     <span>{["🫀", "🧠", "💊", "🏃"][card]}</span>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       ) : activeGame === "math" ? (
//         // Math Game UI (unchanged)
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center justify-between">
//               <span>Quick Math Challenge</span>
//               <div className="flex gap-2 items-center">
//                 <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
//                   <Trophy className="w-5 h-5 text-primary" />
//                   <span className="font-bold">{mathScore}</span>
//                 </div>
//                 <Button variant="outline" onClick={() => {
//                   setActiveGame(null);
//                   showInfo("Math Challenge Exited", `Your final score: ${mathScore}`);
//                 }}>
//                   Exit Game
//                 </Button>
//               </div>
//             </CardTitle>
//             <CardDescription>Solve as many problems as you can!</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-6">
//             <div className="text-center space-y-4">
//               <div className="text-5xl font-bold text-foreground">
//                 {mathQuestion.num1} + {mathQuestion.num2} = ?
//               </div>
//               <div className="flex gap-4 items-center justify-center max-w-md mx-auto">
//                 <input
//                   type="number"
//                   value={mathQuestion.answer ?? ""}
//                   onChange={(e) => setMathQuestion({ ...mathQuestion, answer: e.target.value})}
//                   onKeyPress={(e) => e.key === "Enter" && checkMathAnswer()}
//                   className="flex-1 px-4 py-3 text-2xl text-center border-2 border-border rounded-xl bg-background focus:outline-none focus:border-primary"
//                   placeholder="?"
//                   autoFocus
//                 />
//                 <Button onClick={checkMathAnswer} size="lg" className="px-8">
//                   Check
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       ) : activeGame === "word" ? (
//         // Word Game UI (unchanged)
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center justify-between">
//               <span>Word Recall Challenge</span>
//               <Button variant="outline" onClick={() => {
//                 setActiveGame(null);
//                 showInfo("Word Game Exited", "Keep practicing your memory!");
//               }}>
//                 Exit Game
//               </Button>
//             </CardTitle>
//             <CardDescription>Memorize the words, then recall them in order</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-6">
//             <div className="space-y-4">
//               <div className="p-6 bg-accent rounded-xl">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="text-lg font-semibold">Words to memorize:</h3>
//                   {wordPhase === "memorize" && (
//                     <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
//                       <Clock className="w-4 h-4" />
//                       <span>{timeLeft}s</span>
//                     </div>
//                   )}
//                 </div>
//                 <div className="flex flex-wrap gap-3">
//                   {wordPhase === "memorize" && wordSequence.map((word, idx) => (
//                     <div key={idx} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-lg">
//                       {word}
//                     </div>
//                   ))}
//                 </div>
//                 {wordPhase === "recall" && (
//                   <div className="text-center text-muted-foreground">
//                     The words have been hidden. Recall them in the correct order!
//                   </div>
//                 )}
//               </div>
//               <div className="p-6 bg-muted rounded-xl">
//                 <h3 className="text-lg font-semibold mb-4">Available words:</h3>
//                 <div className="flex flex-wrap gap-2">
//                   {healthWords.map((word, idx) => (
//                     <Button
//                       key={idx}
//                       variant="outline"
//                       onClick={() => {
//                         if (wordPhase !== "recall") {
//                           showWarning("Wait!", "Memorize phase is still active");
//                           return;
//                         }
//                         setUserSequence([...userSequence, { word, index: userSequence.length }]);
//                         showInfo("Word Added", `Added "${word}" to your sequence`);
//                       }}
//                     >
//                       {word}
//                     </Button>
//                   ))}
//                 </div>
//               </div>
//               {userSequence.length > 0 && (
//                 <div className="p-6 bg-accent rounded-xl">
//                   <h3 className="text-lg font-semibold mb-4">Your sequence:</h3>
//                   <div className="flex flex-wrap gap-3">
//                     {userSequence.map((word, idx) => (
//                       <div key={idx} className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold">
//                         {word.word}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//               <div className="flex gap-4">
//                 <Button
//                   onClick={() => {
//                     const correct = wordSequence.length === userSequence.length && wordSequence.every((word, i) => word === userSequence[i].word);
//                     if (correct) {
//                       showSuccess("🎉 Perfect Memory! 🎉", "You recalled all words correctly!");
//                     } else {
//                       const correctWords = userSequence.filter((word, i) => word.word === wordSequence[i]).length;
//                       showError("❌ Not quite right", `You got ${correctWords} out of ${wordSequence.length} correct`);
//                     }
//                   }}
//                   disabled={userSequence.length !== wordSequence.length}
//                   className="flex-1"
//                 >
//                   Check Answer
//                 </Button>
//                 <Button variant="outline" onClick={() => {
//                   setUserSequence([]);
//                   showInfo("Reset", "Your sequence has been cleared");
//                 }}>
//                   Reset Selections
//                 </Button>
//                 <Button variant="secondary" onClick={startWordGame}>
//                   Restart Game
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       ) : activeGame === "pattern" ? (
//         renderPatternGame()
//       ) : null}

//       <Card className="bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Award className="w-6 h-6 text-primary" />
//             Benefits of Brain Training
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <ul className="space-y-2 text-muted-foreground">
//             <li className="flex items-start gap-2">
//               <span className="text-primary">✓</span>
//               <span>Improves memory and cognitive function</span>
//             </li>
//             <li className="flex items-start gap-2">
//               <span className="text-primary">✓</span>
//               <span>Enhances problem-solving abilities</span>
//             </li>
//             <li className="flex items-start gap-2">
//               <span className="text-primary">✓</span>
//               <span>Boosts concentration and focus</span>
//             </li>
//             <li className="flex items-start gap-2">
//               <span className="text-primary">✓</span>
//               <span>May help prevent cognitive decline</span>
//             </li>
//           </ul>
//         </CardContent>
//       </Card>
//     </div>
//   );

  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100  overflow-hidden">
    
    {/* HEADER */}
    <div className="relative mb-10">
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-3xl rounded-full" />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/20 bg-primary/5 mb-5">
          <Brain className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold tracking-wide text-primary uppercase">
            Brain Fitness Center
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-foreground leading-tight">
          Train Your{" "}
          <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Brain
          </span>{" "}
          Daily
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl mt-5 max-w-2xl leading-relaxed">
          Exercise your mind with fun, health-themed cognitive games designed
          to improve memory, focus, and cognitive performance.
        </p>
      </div>
    </div>

    {/* GAME CARDS */}
    {!activeGame ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {games.map((game) => {
          const Icon = game.icon;

          return (
            <Card
              key={game.id}
              className="
                group
                relative
                overflow-hidden
                rounded-3xl
                border
                border-border/50
                bg-white/90
                backdrop-blur-xl
                shadow-sm
                hover:shadow-3xl
                hover:-translate-y-2
                transition-all
                duration-500
                cursor-pointer
                p-0
              "
              onClick={() => {
                if (game.id === "memory") startMemoryGame();
                else if (game.id === "math") startMathGame();
                else if (game.id === "word") startWordGame();
                else if (game.id === "pattern") startPatternGame();
              }}
            >
              {/* TOP GLOW */}
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${game.color}`}
              />

              {/* BACKGROUND EFFECT */}
              <div
                className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${game.color} opacity-10 blur-3xl`}
              />

              <CardHeader className="relative z-10 pb-4">
               <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4}`}
            >
              <Icon className={`w-7 h-7 ${game.color}`} />
            </div>

                <CardTitle className="text-2xl font-bold tracking-tight mb-2">
                  {game.name}
                </CardTitle>

                <CardDescription className="text-base leading-relaxed min-h-[72px]">
                  {game.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="relative z-10 pt-0">
                <Button
                  className={`
                    w-full
                    h-12
                    rounded-2xl
                    text-base
                    font-semibold
                    border-0
                    bg-gradient-to-r ${game.color}
                    hover:opacity-90
                    transition-all
                    duration-300
                    group-hover:scale-110
                    shadow-lg
                  `}
                >
                  Play Now
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
              <div className="flex gap-2">
                <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span className="font-bold">{matchedCards.length / 2} / {memoryCards.length / 2} pairs</span>
                </div>
                <Button variant="outline" onClick={() => {
                  setActiveGame(null);
                  showInfo("Game Exited", "Come back anytime to play again!");
                }}>
                  Exit Game
                </Button>
              </div>
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
                  className={`aspect-square rounded-xl flex items-center justify-center text-4xl font-bold cursor-pointer transition-all ${flippedCards.includes(index) || matchedCards.includes(index)
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
        // Math Game UI (unchanged)
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Quick Math Challenge</span>
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span className="font-bold">{mathScore}</span>
                </div>
                <Button variant="outline" onClick={() => {
                  setActiveGame(null);
                  showInfo("Math Challenge Exited", `Your final score: ${mathScore}`);
                }}>
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
                  value={mathQuestion.answer ?? ""}
                  onChange={(e) => setMathQuestion({ ...mathQuestion, answer: e.target.value})}
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
        // Word Game UI (unchanged)
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Word Recall Challenge</span>
              <Button variant="outline" onClick={() => {
                setActiveGame(null);
                showInfo("Word Game Exited", "Keep practicing your memory!");
              }}>
                Exit Game
              </Button>
            </CardTitle>
            <CardDescription>Memorize the words, then recall them in order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-6 bg-accent rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Words to memorize:</h3>
                  {wordPhase === "memorize" && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                      <Clock className="w-4 h-4" />
                      <span>{timeLeft}s</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {wordPhase === "memorize" && wordSequence.map((word, idx) => (
                    <div key={idx} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-lg">
                      {word}
                    </div>
                  ))}
                </div>
                {wordPhase === "recall" && (
                  <div className="text-center text-muted-foreground">
                    The words have been hidden. Recall them in the correct order!
                  </div>
                )}
              </div>
              <div className="p-6 bg-muted rounded-xl">
                <h3 className="text-lg font-semibold mb-4">Available words:</h3>
                <div className="flex flex-wrap gap-2">
                  {healthWords.map((word, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      onClick={() => {
                        if (wordPhase !== "recall") {
                          showWarning("Wait!", "Memorize phase is still active");
                          return;
                        }
                        setUserSequence([...userSequence, { word, index: userSequence.length }]);
                        showInfo("Word Added", `Added "${word}" to your sequence`);
                      }}
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
                      <div key={idx} className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold">
                        {word.word}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    const correct = wordSequence.length === userSequence.length && wordSequence.every((word, i) => word === userSequence[i].word);
                    if (correct) {
                      showSuccess("🎉 Perfect Memory! 🎉", "You recalled all words correctly!");
                    } else {
                      const correctWords = userSequence.filter((word, i) => word.word === wordSequence[i]).length;
                      showError("❌ Not quite right", `You got ${correctWords} out of ${wordSequence.length} correct`);
                    }
                  }}
                  disabled={userSequence.length !== wordSequence.length}
                  className="flex-1"
                >
                  Check Answer
                </Button>
                <Button variant="outline" onClick={() => {
                  setUserSequence([]);
                  showInfo("Reset", "Your sequence has been cleared");
                }}>
                  Reset Selections
                </Button>
                <Button variant="secondary" onClick={startWordGame}>
                  Restart Game
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : activeGame === "pattern" ? (
        renderPatternGame()
      ) : null}

      {/* BENEFITS */}
    <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-10">
      {[
        {
          icon: Brain,
          text: "Improves memory and cognitive function",
          color: "text-blue-500",
          bg: "bg-blue-500/10",
        },
        {
          icon: Puzzle,
          text: "Enhances problem-solving abilities",
          color: "text-purple-500",
          bg: "bg-purple-500/10",
        },
        {
          icon: Target,
          text: "Boosts concentration and focus",
          color: "text-green-500",
          bg: "bg-green-500/10",
        },
        {
          icon: Award,
          text: "May help prevent cognitive decline",
          color: "text-orange-500",
          bg: "bg-orange-500/10",
        },
      ].map((benefit, index) => {
        const Icon = benefit.icon;

        return (
          <div
            key={index}
            className="group rounded-3xl border border-border/50 bg-white/80 backdrop-blur-xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${benefit.bg}`}
            >
              <Icon className={`w-7 h-7 ${benefit.color}`} />
            </div>

            <p className="text-sm md:text-base font-medium leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors">
              {benefit.text}
            </p>
          </div>
        );
      })}
    </div>
    </div>
  );

};

export default BrainGames;