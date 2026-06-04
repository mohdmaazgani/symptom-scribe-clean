import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Award,
  Trophy,
  Target,
  Lightbulb,
  Puzzle,
  Clock,
  Activity,
  Heart,
  Moon,
  Droplet,
  TrendingUp,
  Zap,
  Shield,
  Flame,
  Sparkles,
  Timer,
  SkipForward,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showInfo, showWarning } from "@/lib/toast-helpers";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

interface TrendQuestion {
  id: number;
  metricType: "steps" | "heart_rate" | "sleep" | "water";
  values: number[];
  pattern: string;
  patternDescription: string;
  correctAnswer: number;
  options: number[];
}
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

const games = [
  {
    id: "memory",
    name: "Memory Match",
    icon: Brain,
    description: "Match pairs of health-themed cards to boost your memory",
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
    gradient: "from-blue-500 to-cyan-500",
    shadow: "shadow-blue-500/20",
  },
  {
    id: "math",
    name: "Quick Math",
    icon: Target,
    description: "Solve mental math problems to sharpen your calculation skills",
    color: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-500",
    gradient: "from-purple-500 to-pink-500",
    shadow: "shadow-purple-500/20",
  },
  {
    id: "word",
    name: "Word Recall",
    icon: Lightbulb,
    description: "Memorize and recall health-related word sequences",
    color: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-500",
    gradient: "from-green-500 to-emerald-500",
    shadow: "shadow-green-500/20",
  },
  {
    id: "pattern",
    name: "Pattern Recognition",
    icon: Puzzle,
    description: "Complete the health trend by finding the next day's value",
    color: "from-orange-500/20 to-red-500/20",
    iconColor: "text-orange-500",
    gradient: "from-orange-500 to-red-500",
    shadow: "shadow-orange-500/20",
  },
];

const benefits = [
  {
    icon: Heart,
    title: "Cognitive Health",
    description: "Improves memory and cognitive function",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    icon: Zap,
    title: "Mental Agility",
    description: "Enhances problem-solving and logic abilities",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    icon: Target,
    title: "Focus & Flow",
    description: "Boosts concentration and mental clarity",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Shield,
    title: "Neuroprotection",
    description: "May help prevent age-related cognitive decline",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
];

const BrainGames = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [memoryCards, setMemoryCards] = useState<number[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);
  const [memoryGameWon, setMemoryGameWon] = useState(false);
  const [mathQuestion, setMathQuestion] = useState({ num1: 0, num2: 0, operator: "+", answer: "" });
  const [mathScore, setMathScore] = useState(0);
  const [mathTimeLeft, setMathTimeLeft] = useState(15);
  const mathTimerRef = useRef<number | null>(null);
  const [wordSequence, setWordSequence] = useState<string[]>([]);
  const [userSequence, setUserSequence] = useState<{ word: string; index: number }[]>([]);
  const [wordPhase, setWordPhase] = useState<"memorize" | "recall">("memorize");
  const [timeLeft, setTimeLeft] = useState(10);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Pattern Recognition Game States
  const [patternScore, setPatternScore] = useState(0);
  const [patternStreak, setPatternStreak] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<TrendQuestion | null>(null);
  const [showPatternFeedback, setShowPatternFeedback] = useState(false);
  const [isPatternCorrect, setIsPatternCorrect] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [xp, setXp] = useState(0);
  const [lifelineUsed, setLifelineUsed] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<number[]>([]);
  const [timedMode, setTimedMode] = useState(false);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(15);
  const [showFireStreak, setShowFireStreak] = useState(false);
  const timerRef = useRef<number | null>(null);
  const wordTimeoutRef = useRef<number | null>(null);
  const TOTAL_QUESTIONS = 10;
  const XP_PER_QUESTION = 10;
  const XP_PER_LEVEL = 100;

  // Calculate level dynamically from XP
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const prevLevelRef = useRef(level);

  const [statsLoaded, setStatsLoaded] = useState(false);

  // Fetch stats on mount
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("xp, level")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          if (data.xp !== undefined && data.xp !== null) {
            setXp(data.xp);
          }
        }
      } catch (error) {
        console.error("Error loading user stats:", error);
      } finally {
        setStatsLoaded(true);
      }
    };
    fetchUserStats();
  }, []);

  // Save stats when XP changes (after initial load is complete)
  useEffect(() => {
    if (!statsLoaded) return;

    const saveStats = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const newLevel = Math.floor(xp / XP_PER_LEVEL) + 1;
        const { error } = await supabase
          .from("profiles")
          .update({
            xp: xp,
            level: newLevel,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (error) throw error;
      } catch (error) {
        console.error("Error saving user stats:", error);
      }
    };

    saveStats();
  }, [xp, statsLoaded]);

  const { toast } = useToast();

  const healthWords = [
    "Heart",
    "Brain",
    "Vitamin",
    "Exercise",
    "Nutrition",
    "Sleep",
    "Wellness",
    "Fitness",
    "Immune",
    "Cardio",
    "Protein",
    "Hydration",
  ];

  // Trigger confetti animation
  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7"],
    });

    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 50,
        origin: { y: 0.5, x: 0.3 },
        colors: ["#ff6b6b", "#4ecdc4"],
      });
      confetti({
        particleCount: 100,
        spread: 50,
        origin: { y: 0.5, x: 0.7 },
        colors: ["#45b7d1", "#96ceb4"],
      });
    }, 200);
  };

  // Level Up check
  useEffect(() => {
    if (level > prevLevelRef.current) {
      showSuccess("🎉 LEVEL UP! 🎉", `You reached Level ${level}!`);
      triggerConfetti();
    }
    prevLevelRef.current = level;
  }, [level]);

  // Check streak and trigger effects
  useEffect(() => {
    if (patternStreak >= 3 && patternStreak < 5) {
      setShowFireStreak(true);
      toast({
        title: "🔥 On Fire!",
        description: `${patternStreak} correct answers in a row!`,
      });
    } else if (patternStreak >= 5 && patternStreak < 10) {
      setShowFireStreak(true);
      showSuccess("🔥 BLAZING!", `${patternStreak} streak! Keep going!`);
      triggerConfetti();
    } else if (patternStreak >= 10) {
      setShowFireStreak(true);
      showSuccess("💎 LEGENDARY!", `${patternStreak} streak! You're a master!`);
      triggerConfetti();
    }

    // Reset fire streak animation after 2 seconds
    const timer = setTimeout(() => setShowFireStreak(false), 2000);
    return () => clearTimeout(timer);
  }, [patternStreak, toast]);

  // Timer for timed mode
  useEffect(() => {
    if (
      activeGame === "pattern" &&
      timedMode &&
      !showPatternFeedback &&
      !gameCompleted &&
      currentQuestion
    ) {
      if (timerRef.current) clearInterval(timerRef.current);

      setQuestionTimeLeft(15);
      timerRef.current = window.setInterval(() => {
        setQuestionTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            if (!showPatternFeedback && currentQuestion) {
              handlePatternAnswer(-1); // -1 indicates timeout
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000) as unknown as number;

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timedMode, activeGame, currentQuestion, showPatternFeedback, gameCompleted]);

  // ─── Memory Game ───────────────────────────────────────────────────────────

  const resetMemoryGame = () => {
    setFlippedCards([]);
    setMatchedCards([]);
    setMemoryGameWon(false);
    setTimeout(() => {
      const cards = [...Array(8)].map((_, i) => i % 4);
      setMemoryCards(shuffleArray(cards));
    }, 0);
    showSuccess("New Game!", "Cards reshuffled — good luck!");
  };

  // ─── Math Game ─────────────────────────────────────────────────────────────

  // ─── Word Game ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (wordPhase !== "memorize" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [wordPhase, timeLeft]);

  // Cleanup timeout when leaving Word game or unmounting
  useEffect(() => {
    if (activeGame !== "word" && wordTimeoutRef.current) {
      clearTimeout(wordTimeoutRef.current);
      wordTimeoutRef.current = null;
    }
  }, [activeGame]);

  // ─── Pattern Recognition Game ──────────────────────────────────────────────

  const generateTrendQuestion = (): TrendQuestion => {
    const metricTypes = ["steps", "heart_rate", "sleep", "water"] as const;
    const metricType = metricTypes[Math.floor(Math.random() * metricTypes.length)];

    const patterns = [
      {
        name: "increasing",
        getValue: (i: number, start: number) => start + i * 5,
        step: 5,
        description: "Increasing by 5 each day",
      },
      {
        name: "increasing_fast",
        getValue: (i: number, start: number) => start + i * 10,
        step: 10,
        description: "Increasing by 10 each day",
      },
      {
        name: "decreasing",
        getValue: (i: number, start: number) => start - i * 5,
        step: 5,
        description: "Decreasing by 5 each day",
      },
      {
        name: "decreasing_fast",
        getValue: (i: number, start: number) => start - i * 10,
        step: 10,
        description: "Decreasing by 10 each day",
      },
      {
        name: "multiply",
        getValue: (i: number, start: number) => start * Math.pow(2, i),
        step: "x2",
        description: "Doubling each day",
      },
      {
        name: "alternating",
        getValue: (i: number, start: number) => (i % 2 === 0 ? start : start + 15),
        step: 15,
        description: "Alternating between two values",
      },
    ];

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    let startValue = 0;
    switch (metricType) {
      case "steps":
        startValue = Math.floor(Math.random() * 3000) + 4000;
        break;
      case "heart_rate":
        startValue = Math.floor(Math.random() * 30) + 60;
        break;
      case "sleep":
        startValue = Math.floor(Math.random() * 3) + 5;
        break;
      case "water":
        startValue = Math.floor(Math.random() * 4) + 4;
        break;
    }

    const values = [];
    for (let i = 0; i < 3; i++) {
      let val = pattern.getValue(i, startValue);
      val =
        metricType === "sleep" || metricType === "water"
          ? Math.round(val * 10) / 10
          : Math.round(val);
      values.push(val);
    }

    let correctAnswer = pattern.getValue(3, startValue);
    correctAnswer =
      metricType === "sleep" || metricType === "water"
        ? Math.round(correctAnswer * 10) / 10
        : Math.round(correctAnswer);

    const options = [correctAnswer];
    while (options.length < 4) {
      let offset = 0;
      if (pattern.name.includes("increasing")) {
        offset = Math.floor(Math.random() * 15) + 5;
        const wrongOption = correctAnswer - offset;
        if (!options.includes(wrongOption) && wrongOption > 0) options.push(wrongOption);
      } else if (pattern.name.includes("decreasing")) {
        offset = Math.floor(Math.random() * 15) + 5;
        const wrongOption = correctAnswer + offset;
        if (!options.includes(wrongOption)) options.push(wrongOption);
      } else {
        offset = Math.floor(Math.random() * 20) + 10;
        const wrongOption = correctAnswer + (Math.random() > 0.5 ? offset : -offset);
        if (!options.includes(wrongOption) && wrongOption > 0) options.push(wrongOption);
      }
    }

    return {
      id: Date.now(),
      metricType,
      values,
      pattern: pattern.name,
      patternDescription: pattern.description,
      correctAnswer,
      options: shuffleArray(options),
    };
  };

  const startPatternGame = () => {
    setPatternScore(0);
    setPatternStreak(0);
    setQuestionsAnswered(0);
    setGameCompleted(false);
    setCurrentQuestion(generateTrendQuestion());
    setShowPatternFeedback(false);
    setActiveGame("pattern");
    showSuccess("Pattern Recognition Started!", "Complete the health trend by finding Day 4 value");
  };

  const useFiftyFifty = () => {
    if (lifelineUsed || !currentQuestion || showPatternFeedback) return;

    const wrongOptions = currentQuestion.options.filter(
      (opt) => opt !== currentQuestion.correctAnswer
    );
    const randomWrong = shuffleArray(wrongOptions).slice(0, 1);
    const newOptions = shuffleArray([currentQuestion.correctAnswer, ...randomWrong]);

    setFilteredOptions(newOptions);
    setLifelineUsed(true);
    showInfo("50-50 Used!", "Two wrong options removed!");
  };

  const handlePatternAnswer = useCallback(
    (answer: number) => {
      if (showPatternFeedback || !currentQuestion || gameCompleted) return;

      if (timerRef.current) clearInterval(timerRef.current);

      const isTimeout = answer === -1;
      const isCorrect = !isTimeout && answer === currentQuestion.correctAnswer;
      setIsPatternCorrect(isCorrect);
      setShowPatternFeedback(true);
      const newQuestionsCount = questionsAnswered + 1;
      setQuestionsAnswered(newQuestionsCount);

      let pointsEarned = 0;
      let xpEarned = 0;

      if (isCorrect) {
        let timeBonus = 0;
        if (timedMode && questionTimeLeft > 0) {
          timeBonus = Math.floor(questionTimeLeft / 3);
          pointsEarned = 10 + timeBonus;
          xpEarned = XP_PER_QUESTION + Math.floor(timeBonus / 2);
        } else {
          pointsEarned = 10;
          xpEarned = XP_PER_QUESTION;
        }

        const newScore = patternScore + pointsEarned;
        const newStreak = patternStreak + 1;
        const newXp = xp + xpEarned;

        setPatternScore(newScore);
        setPatternStreak(newStreak);
        setXp(newXp);

        if (timeBonus > 0) {
          showSuccess(
            `✓ Correct! ⚡`,
            `+${pointsEarned} points! (${timeBonus} time bonus) Streak: ${newStreak}`
          );
        } else {
          showSuccess(`✓ Correct!`, `+${pointsEarned} points! Streak: ${newStreak}`);
        }

        toast({
          title: "✓ Correct!",
          description: `Day 4 value is ${currentQuestion.correctAnswer}`,
        });
      } else {
        setPatternStreak(0);
        const msg = isTimeout
          ? "Time's up!"
          : `The correct trend was: ${currentQuestion.patternDescription}`;
        showError("✗ Incorrect", msg);

        toast({
          title: "✗ Incorrect",
          description: `Day 4 should be ${currentQuestion.correctAnswer}. ${currentQuestion.patternDescription}`,
          variant: "destructive",
        });
      }

      if (newQuestionsCount >= TOTAL_QUESTIONS) {
        setGameCompleted(true);
        const percentage = ((patternScore + pointsEarned) / (TOTAL_QUESTIONS * 10)) * 100;

        if (percentage >= 100) {
          triggerConfetti();
          showSuccess("🎉 PERFECT GAME! 🎉", "You scored 100/100! Amazing!");
        } else if (percentage >= 80) {
          triggerConfetti();
          showSuccess("🌟 EXCELLENT!", "Great job! Keep practicing!");
        }

        // Bonus XP for completing
        const completionBonus = 50;
        setXp((prev) => prev + completionBonus);
        showSuccess("Game Complete!", `+${completionBonus} XP bonus!`);
        return;
      }

      setTimeout(() => {
        const nextQuestion = generateTrendQuestion();
        setCurrentQuestion(nextQuestion);
        setFilteredOptions([]);
        setShowPatternFeedback(false);
      }, 2000);
    },
    [
      showPatternFeedback,
      currentQuestion,
      gameCompleted,
      questionsAnswered,
      timedMode,
      questionTimeLeft,
      patternScore,
      patternStreak,
      xp,
      toast,
    ]
  );

  const resetPatternGame = () => {
    setPatternScore(0);
    setPatternStreak(0);
    setQuestionsAnswered(0);
    setGameCompleted(false);
    setLifelineUsed(false);
    setFilteredOptions([]);
    setTimedMode(false);
    setQuestionTimeLeft(15);
    setCurrentQuestion(generateTrendQuestion());
    setShowPatternFeedback(false);
    showInfo("Game Restarted", "Try to beat your previous score!");
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case "steps":
        return <Activity className="w-6 h-6 text-green-500" />;
      case "heart_rate":
        return <Heart className="w-6 h-6 text-red-500" />;
      case "sleep":
        return <Moon className="w-6 h-6 text-purple-500" />;
      case "water":
        return <Droplet className="w-6 h-6 text-blue-500" />;
      default:
        return <TrendingUp className="w-6 h-6 text-orange-500" />;
    }
  };

  const getMetricTitle = (type: string) => {
    switch (type) {
      case "steps":
        return "Daily Steps";
      case "heart_rate":
        return "Heart Rate (BPM)";
      case "sleep":
        return "Sleep (Hours)";
      case "water":
        return "Water Intake (Glasses)";
      default:
        return "Health Metric";
    }
  };

  const getMetricUnit = (type: string) => {
    switch (type) {
      case "steps":
        return "steps";
      case "heart_rate":
        return "BPM";
      case "sleep":
        return "hours";
      case "water":
        return "glasses";
      default:
        return "";
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
    setMathScore(0);
    generateMathQuestion(0);
    setActiveGame("math");
    showSuccess("Math Challenge Started!", "Solve as many problems as you can");
  };

  const startWordGame = () => {
    if (wordTimeoutRef.current) {
      clearTimeout(wordTimeoutRef.current);
      wordTimeoutRef.current = null;
    }

    const sequence = shuffleArray([...healthWords]).slice(0, Math.min(5, healthWords.length));

    setWordSequence(sequence);
    setUserSequence([]);
    setWordPhase("memorize");
    setTimeLeft(10);
    setActiveGame("word");

    showInfo("Memorize these words!", "You have 10 seconds...");

    wordTimeoutRef.current = window.setTimeout(() => {
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

  const generateMathQuestion = useCallback(
    (score = mathScore) => {
      const availableOperators = ["+"];
      if (score >= 3) availableOperators.push("-");
      if (score >= 6) availableOperators.push("*");

      const operator = availableOperators[Math.floor(Math.random() * availableOperators.length)];

      let range = 20;
      if (score >= 10) range = 150;
      else if (score >= 6) range = 100;
      else if (score >= 3) range = 50;

      let num1 = 0;
      let num2 = 0;

      if (operator === "+") {
        num1 = Math.floor(Math.random() * range) + 5;
        num2 = Math.floor(Math.random() * range) + 5;
      } else if (operator === "-") {
        const n1 = Math.floor(Math.random() * range) + 10;
        const n2 = Math.floor(Math.random() * range) + 5;
        num1 = Math.max(n1, n2);
        num2 = Math.min(n1, n2);
      } else if (operator === "*") {
        let maxFactor = 9;
        if (score >= 10) maxFactor = 15;
        else if (score >= 8) maxFactor = 12;
        num1 = Math.floor(Math.random() * (maxFactor - 2)) + 2;
        num2 = Math.floor(Math.random() * 9) + 2;
      }

      setMathQuestion({ num1, num2, operator, answer: "" });
    },
    [mathScore]
  );

  useEffect(() => {
    if (activeGame === "math") {
      if (mathTimerRef.current) clearInterval(mathTimerRef.current);

      setMathTimeLeft(15);
      mathTimerRef.current = window.setInterval(() => {
        setMathTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(mathTimerRef.current!);

            showError("Time's up!", "Be quicker next time!");
            toast({
              title: "✗ Time's up!",
              description: "The time limit has been exceeded",
              variant: "destructive",
            });

            generateMathQuestion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000) as unknown as number;

      return () => {
        if (mathTimerRef.current) clearInterval(mathTimerRef.current);
      };
    }
  }, [
    activeGame,
    mathQuestion.num1,
    mathQuestion.num2,
    mathQuestion.operator,
    generateMathQuestion,
    toast,
  ]);

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

        showSuccess(
          "Match Found!",
          `You matched a pair! (${matchedCards.length / 2 + 1}/${memoryCards.length / 2})`
        );

        if (matchedCards.length + 2 === memoryCards.length) {
          setMemoryGameWon(true);
          const winXp = 30;
          setXp((prev) => prev + winXp);
          showSuccess(
            "🎉 Congratulations! 🎉",
            `You've matched all pairs! Great memory! (+${winXp} XP)`
          );
          toast({
            title: "🎉 Congratulations!",
            description: `You've matched all pairs! (+${winXp} XP)`,
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
    let correct = 0;
    if (mathQuestion.operator === "+") {
      correct = mathQuestion.num1 + mathQuestion.num2;
    } else if (mathQuestion.operator === "-") {
      correct = mathQuestion.num1 - mathQuestion.num2;
    } else if (mathQuestion.operator === "*") {
      correct = mathQuestion.num1 * mathQuestion.num2;
    }

    const userAnswer = parseInt(mathQuestion.answer);
    if (isNaN(userAnswer)) {
      showWarning("Invalid Input", "Please enter a valid number");
      return;
    }

    if (userAnswer === correct) {
      const newScore = mathScore + 1;
      setMathScore(newScore);
      const mathXp = 5;
      setXp((prev) => prev + mathXp);
      showSuccess("✓ Correct! ✓", `Score: ${newScore} (+${mathXp} XP)`);
      toast({
        title: "✓ Correct!",
        description: `Score: ${newScore} (+${mathXp} XP)`,
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

  // ─── Pattern game renderer ─────────────────────────────────────────────────

  const renderPatternGame = () => {
    if (gameCompleted) {
      const maxScore = TOTAL_QUESTIONS * 10;
      const percentage = (patternScore / maxScore) * 100;
      return (
        <Card className="border-2 border-primary/20 overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-primary/5 to-primary-glow/5 border-b border-primary/10">
            <CardTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
              <Trophy className="w-8 h-8 text-primary animate-bounce" />
              Game Complete!
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Great job spotting the trends!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 p-8 text-center">
            <div className="relative p-10 bg-gradient-to-br from-primary/10 via-primary-glow/5 to-background rounded-3xl border border-primary/20 shadow-xl overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary-glow/10 rounded-full blur-3xl group-hover:bg-primary-glow/20 transition-colors" />

              <Trophy className="w-20 h-20 mx-auto text-primary mb-6 drop-shadow-glow" />
              <p className="text-5xl font-black mb-2 tracking-tight">
                {patternScore}{" "}
                <span className="text-2xl text-muted-foreground font-normal">/ {maxScore}</span>
              </p>
              <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm mb-6">
                Final Score
              </p>

              <div className="max-w-md mx-auto">
                <div className="mt-4 h-3 bg-muted rounded-full overflow-hidden p-0.5 border border-border/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-primary to-primary-glow rounded-full"
                  />
                </div>
              </div>

              <p className="mt-8 text-lg font-semibold text-foreground max-w-sm mx-auto">
                {percentage >= 100
                  ? "🌟 PERFECT! You're a health trend master!"
                  : percentage >= 80
                    ? "👍 Excellent! Your analytical skills are sharp!"
                    : percentage >= 60
                      ? "💪 Good job! Keep training to reach perfection!"
                      : "📚 Keep practicing! Consistency is key to improvement!"}
              </p>

              <div className="mt-10 flex items-center justify-center gap-12">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{level}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Level
                  </p>
                </div>
                <div className="w-px h-12 bg-border/50" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{xp}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Total XP
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Button
                onClick={resetPatternGame}
                size="lg"
                className="flex-1 rounded-2xl h-14 font-bold shadow-lg hover:shadow-primary/20 transition-all"
              >
                <RefreshCw className="w-5 h-5 mr-2" /> Play Again
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveGame(null)}
                size="lg"
                className="flex-1 rounded-2xl h-14 font-bold border-2"
              >
                Back to Center
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!currentQuestion) return null;

    const displayOptions = filteredOptions.length > 0 ? filteredOptions : currentQuestion.options;

    return (
      <Card className="border-2 border-primary/10 shadow-2xl overflow-hidden rounded-3xl">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                {showFireStreak ? (
                  <div className="p-2 bg-orange-500/20 rounded-xl animate-pulse">
                    <Flame className="w-6 h-6 text-orange-500" />
                  </div>
                ) : (
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                )}
                Complete the Health Trend
              </CardTitle>
              <CardDescription className="text-base font-medium">
                Identify the pattern and predict Day 4
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="font-bold text-primary">{patternScore}</span>
              </div>
              <div
                className={`flex items-center gap-2 border px-4 py-2 rounded-2xl transition-all duration-500 ${patternStreak >= 3 ? "bg-orange-500/20 border-orange-500/30 text-orange-500 animate-pulse" : "bg-secondary/10 border-border"}`}
              >
                <Flame className="w-4 h-4" />
                <span className="font-bold">{patternStreak}</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-2xl">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="font-bold text-purple-500">Lv.{level}</span>
              </div>
              <div className="flex items-center gap-2 bg-accent/20 border border-accent/30 px-4 py-2 rounded-2xl">
                <Brain className="w-4 h-4 text-accent-foreground" />
                <span className="font-bold">
                  Q{questionsAnswered + 1}/{TOTAL_QUESTIONS}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <Button
              variant={timedMode ? "default" : "outline"}
              size="sm"
              onClick={() => setTimedMode(!timedMode)}
              className="gap-2 rounded-full font-bold px-4 h-10 transition-all border-2"
            >
              <Timer className="w-4 h-4" />
              {timedMode ? "Timed Mode Active" : "Casual Mode"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={useFiftyFifty}
              disabled={lifelineUsed || showPatternFeedback}
              className={`gap-2 rounded-full font-bold px-4 h-10 transition-all border-2 ${lifelineUsed ? "opacity-50" : "hover:border-primary/50 hover:bg-primary/5"}`}
            >
              <Shield className="w-4 h-4 text-primary" />
              50-50 {lifelineUsed ? "Used" : "Lifeline"}
            </Button>
            <div className="flex-1" />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetPatternGame}
                className="rounded-full h-10 font-medium text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="w-4 h-4 mr-1" /> Reset
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveGame(null)}
                className="rounded-full h-10 font-medium text-muted-foreground hover:text-destructive"
              >
                Exit
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 p-8">
          <AnimatePresence mode="wait">
            {timedMode && !showPatternFeedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`flex items-center justify-center gap-3 p-4 rounded-2xl max-w-xs mx-auto border-2 ${questionTimeLeft <= 5 ? "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse" : "bg-primary/5 border-primary/20 text-primary"}`}
              >
                <Timer className={`w-6 h-6 ${questionTimeLeft <= 5 ? "animate-spin-slow" : ""}`} />
                <span className="text-3xl font-black tracking-tighter">{questionTimeLeft}</span>
                <span className="text-sm font-bold uppercase tracking-widest">seconds</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative p-8 bg-accent/10 border border-border/50 rounded-[2rem] overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              {getMetricIcon(currentQuestion.metricType)}
            </div>

            <div className="flex items-center justify-center gap-3 mb-10">
              <div className="p-2.5 bg-background rounded-xl shadow-sm border border-border/50">
                {getMetricIcon(currentQuestion.metricType)}
              </div>
              <h3 className="text-xl font-bold tracking-tight">
                {getMetricTitle(currentQuestion.metricType)}
              </h3>
            </div>

            <div className="flex items-end justify-center gap-4 sm:gap-8 h-56 mb-8 px-4">
              {currentQuestion.values.map((value, index) => {
                let maxValue = 0;
                switch (currentQuestion.metricType) {
                  case "steps":
                    maxValue = 15000;
                    break;
                  case "heart_rate":
                    maxValue = 150;
                    break;
                  case "sleep":
                    maxValue = 12;
                    break;
                  case "water":
                    maxValue = 10;
                    break;
                }
                const height = (value / maxValue) * 160;
                return (
                  <div key={index} className="flex flex-col items-center gap-4 flex-1 max-w-[80px]">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(40, height)}px` }}
                      className="w-full bg-gradient-to-t from-primary/80 to-primary-glow rounded-2xl shadow-lg relative group"
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border shadow-sm">
                        {value} {getMetricUnit(currentQuestion.metricType)}
                      </div>
                    </motion.div>
                    <div className="text-center">
                      <p className="text-lg font-black text-foreground">{value}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Day {index + 1}
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-col items-center gap-4 flex-1 max-w-[80px]">
                <div className="w-full bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-2xl flex items-center justify-center h-40 group-hover:border-primary/50 transition-colors">
                  <span className="text-4xl font-black text-muted-foreground/30 animate-pulse">
                    ?
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-muted-foreground/40">???</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Day 4
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-background/60 backdrop-blur-sm px-6 py-3 rounded-2xl border border-border/50 inline-block mx-auto text-sm font-medium text-muted-foreground">
              Analyze the progression from Day 1 to Day 3 to find the pattern
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {displayOptions.map((option, idx) => (
              <Button
                key={idx}
                variant={
                  showPatternFeedback && option === currentQuestion.correctAnswer
                    ? "default"
                    : "outline"
                }
                className={`text-xl font-bold py-10 rounded-3xl transition-all duration-300 border-2 ${
                  showPatternFeedback
                    ? option === currentQuestion.correctAnswer
                      ? "bg-primary border-primary scale-105 shadow-xl"
                      : "opacity-40"
                    : "hover:scale-[1.03] hover:border-primary/50 hover:bg-primary/5 shadow-sm active:scale-[0.97]"
                }`}
                onClick={() => handlePatternAnswer(option)}
                disabled={showPatternFeedback}
              >
                {option}
                <span className="text-xs font-medium ml-1.5 opacity-70">
                  {getMetricUnit(currentQuestion.metricType)}
                </span>
              </Button>
            ))}
          </div>

          <AnimatePresence>
            {showPatternFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-3xl border-2 text-center shadow-lg ${isPatternCorrect ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  {isPatternCorrect ? (
                    <div className="bg-green-500 rounded-full p-1">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="bg-red-500 rounded-full p-1">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <p
                    className={`text-xl font-black ${isPatternCorrect ? "text-green-600" : "text-red-600"}`}
                  >
                    {isPatternCorrect ? "BRILLIANT!" : "NOT QUITE!"}
                  </p>
                </div>
                <p className="text-base font-semibold text-foreground">
                  {isPatternCorrect
                    ? `Day 4 is correctly identified as ${currentQuestion.correctAnswer} ${getMetricUnit(currentQuestion.metricType)}`
                    : `The correct answer was ${currentQuestion.correctAnswer} ${getMetricUnit(currentQuestion.metricType)}`}
                </p>
                <div className="mt-3 px-4 py-2 bg-background/50 rounded-xl inline-flex items-center gap-2 text-sm font-medium text-muted-foreground border border-border/50">
                  <Star className="w-3.5 h-3.5 text-yellow-500" />
                  Pattern: {currentQuestion.patternDescription}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    );
  };

  // ─── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-primary"
          >
            <div className="p-2 bg-primary/10 rounded-xl">
              <Brain className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider">Cognitive Training</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black tracking-tight text-foreground"
          >
            Brain Fitness{" "}
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Center
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl leading-relaxed"
          >
            Elevate your cognitive performance through specialized games designed to enhance memory,
            calculation speed, and logical reasoning.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 rounded-[2.5rem] shadow-xl flex items-center gap-8 px-8"
        >
          <div className="text-center">
            <p className="text-3xl font-black text-primary">{level}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Global Level
            </p>
          </div>
          <div className="w-px h-10 bg-border/50" />
          <div className="text-center">
            <p className="text-3xl font-black text-primary">{xp}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Total XP
            </p>
          </div>
          <div className="w-px h-10 bg-border/50" />
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-lg shadow-orange-500/20">
            <Trophy className="w-6 h-6 text-white" />
          </div>
        </motion.div>
      </header>

      <AnimatePresence mode="wait">
        {!activeGame ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-16"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {games.map((game, index) => {
                const Icon = game.icon;
                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    whileHover={{ y: -10 }}
                    className="group relative"
                    role="button"
                    tabIndex={0}
                    aria-label={`Play ${game.name}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (game.id === "memory") startMemoryGame();
                        else if (game.id === "math") startMathGame();
                        else if (game.id === "word") startWordGame();
                        else if (game.id === "pattern") startPatternGame();
                      }
                    }}
                    onClick={() => {
                      if (game.id === "memory") startMemoryGame();
                      else if (game.id === "math") startMathGame();
                      else if (game.id === "word") startWordGame();
                      else if (game.id === "pattern") startPatternGame();
                    }}
                  >
                    <div
                      className={`absolute -inset-1 bg-gradient-to-r ${game.gradient} rounded-[2rem] opacity-0 group-hover:opacity-20 blur-xl transition duration-500`}
                    />
                    <Card className="relative h-full overflow-hidden border-border/50 bg-card/60 backdrop-blur-xl transition-all duration-300 group-hover:border-primary/30 rounded-[2rem] p-4 flex flex-col cursor-pointer shadow-sm group-hover:shadow-2xl">
                      <div
                        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${game.gradient} opacity-[0.03] group-hover:opacity-10 rounded-bl-full transition-opacity duration-500`}
                      />

                      <CardHeader className="pb-4 relative z-10">
                        <div
                          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} border border-border/50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ${game.shadow}`}
                        >
                          <Icon className={`w-7 h-7 ${game.iconColor}`} />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight mb-2 group-hover:text-primary transition-colors">
                          {game.name}
                        </CardTitle>
                        <CardDescription className="text-base font-medium leading-relaxed">
                          {game.description}
                        </CardDescription>
                      </CardHeader>

                      <div className="mt-auto p-6 pt-2 relative z-10">
                        <Button
                          className={`w-full h-12 rounded-2xl font-bold text-white bg-gradient-to-r ${game.gradient} shadow-lg group-hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 border-none`}
                        >
                          Play Now
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <section className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
                <div className="flex items-center gap-3 px-6 py-2 bg-muted/50 rounded-full border border-border">
                  <Award className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold tracking-tight uppercase tracking-widest">
                    Redesigned Benefits
                  </h2>
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="p-6 bg-card/40 backdrop-blur-md border border-border/60 rounded-[2rem] hover:border-primary/20 transition-all duration-300 group shadow-sm hover:shadow-xl hover:-translate-y-2"
                  >
                    <div
                      className={`w-12 h-12 ${benefit.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                    >
                      <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                    </div>
                    <h3 className="text-lg font-bold mb-2 tracking-tight group-hover:text-primary transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                      {benefit.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="game-active"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="pb-20"
          >
            {activeGame === "memory" ? (
              // ── Memory Game ──
              memoryGameWon ? (
                // Win screen — shown after all 4 pairs matched
                <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden rounded-[2.5rem]">
                  <CardHeader className="bg-gradient-to-br from-primary/5 to-primary-glow/5 border-b border-primary/10 py-10">
                    <CardTitle className="text-center text-4xl font-black flex flex-col items-center gap-4">
                      <div className="p-4 bg-yellow-400/20 rounded-full animate-bounce">
                        <Trophy className="w-12 h-12 text-yellow-500" />
                      </div>
                      You Won!
                    </CardTitle>
                    <CardDescription className="text-center text-xl font-medium">
                      Extraordinary memory performance!
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-10 p-10 text-center">
                    <div className="relative p-10 bg-gradient-to-br from-primary/10 via-primary-glow/5 to-background rounded-[3rem] border border-primary/20 shadow-xl overflow-hidden">
                      <div className="text-6xl mb-6">🏆</div>
                      <p className="text-3xl font-black mb-4 tracking-tight">
                        All pairs matched perfectly!
                      </p>
                      <p className="text-lg text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        Your neural pathways are firing with incredible precision today.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                      <Button
                        onClick={resetMemoryGame}
                        size="lg"
                        className="flex-1 rounded-2xl h-14 font-bold shadow-lg hover:shadow-primary/20 transition-all"
                      >
                        <RefreshCw className="w-5 h-5 mr-2" /> Play Again
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setActiveGame(null)}
                        size="lg"
                        className="flex-1 rounded-2xl h-14 font-bold border-2"
                      >
                        Back to Games
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Active game board
                <Card className="border-2 border-primary/10 shadow-2xl overflow-hidden rounded-[2.5rem]">
                  <CardHeader className="bg-muted/30 border-b border-border/50 pb-8 p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <CardTitle className="text-3xl font-black tracking-tight">
                          Memory Match
                        </CardTitle>
                        <CardDescription className="text-base font-bold text-primary">
                          Find all pairs to complete the challenge
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-6 py-3 rounded-2xl">
                          <Trophy className="w-5 h-5 text-primary" />
                          <span className="text-xl font-black text-primary">
                            {matchedCards.length / 2} / {memoryCards.length / 2}
                          </span>
                          <span className="text-xs font-bold text-primary uppercase tracking-widest ml-1">
                            Pairs
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={resetMemoryGame}
                          className="w-12 h-12 rounded-2xl border-2"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setActiveGame(null)}
                          className="h-12 px-6 rounded-2xl font-bold text-muted-foreground hover:text-destructive"
                        >
                          Exit
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 md:p-12">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
                      {memoryCards.map((card, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          role="button"
                          tabIndex={0}
                          aria-label={`Memory card ${index + 1}`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleCardClick(index);
                            }
                          }}
                          onClick={() => handleCardClick(index)}
                          className={`aspect-square rounded-3xl flex items-center justify-center text-5xl cursor-pointer transition-all duration-500 shadow-md ${
                            flippedCards.includes(index) || matchedCards.includes(index)
                              ? "bg-gradient-to-br from-primary to-primary-glow text-white [transform:rotateY(180deg)] shadow-xl shadow-primary/20"
                              : "bg-muted border-2 border-border/50 hover:border-primary/30 hover:bg-accent [transform:rotateY(0deg)]"
                          }`}
                        >
                          <div
                            className={
                              flippedCards.includes(index) || matchedCards.includes(index)
                                ? "[transform:rotateY(180deg)]"
                                : ""
                            }
                          >
                            {flippedCards.includes(index) || matchedCards.includes(index) ? (
                              <span>{["🫀", "🧠", "💊", "🏃"][card]}</span>
                            ) : (
                              <div className="w-8 h-8 rounded-full border-4 border-muted-foreground/20 opacity-20" />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            ) : activeGame === "math" ? (
              // ── Math Game ──
              <Card className="border-2 border-primary/10 shadow-2xl overflow-hidden rounded-[2.5rem]">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-8 p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <CardTitle className="text-3xl font-black tracking-tight">
                        Quick Math
                      </CardTitle>
                      <CardDescription className="text-base font-bold text-primary">
                        Solve the equations as fast as you can
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-6 py-3 rounded-2xl">
                        <Trophy className="w-5 h-5 text-primary" />
                        <span className="text-2xl font-black text-primary">{mathScore}</span>
                        <span className="text-xs font-bold text-primary uppercase tracking-widest ml-1">
                          Score
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setMathScore(0);
                          generateMathQuestion(0);
                          showSuccess("Game Reset!", "Score cleared — start fresh!");
                        }}
                        className="w-12 h-12 rounded-2xl border-2"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setActiveGame(null)}
                        className="h-12 px-6 rounded-2xl font-bold text-muted-foreground hover:text-destructive"
                      >
                        Exit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-10 md:p-20 space-y-12">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`flex items-center justify-center gap-4 p-5 rounded-[2rem] max-w-xs mx-auto border-2 shadow-lg ${mathTimeLeft <= 5 ? "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse" : "bg-primary/5 border-primary/20 text-primary"}`}
                  >
                    <Timer className={`w-8 h-8 ${mathTimeLeft <= 5 ? "animate-spin-slow" : ""}`} />
                    <span className="text-4xl font-black tracking-tighter">{mathTimeLeft}</span>
                    <span className="text-sm font-bold uppercase tracking-widest">Seconds</span>
                  </motion.div>

                  <div className="text-center space-y-12">
                    <motion.div
                      key={`${mathQuestion.num1}-${mathQuestion.num2}`}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-6xl md:text-8xl font-black text-foreground tracking-tighter flex items-center justify-center gap-6"
                    >
                      <span className="bg-muted px-6 py-4 rounded-3xl border border-border shadow-sm">
                        {mathQuestion.num1}
                      </span>
                      <span className="text-primary">
                        {mathQuestion.operator === "*" ? "×" : mathQuestion.operator}
                      </span>
                      <span className="bg-muted px-6 py-4 rounded-3xl border border-border shadow-sm">
                        {mathQuestion.num2}
                      </span>
                      <span className="text-muted-foreground/50">=</span>
                    </motion.div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center max-w-xl mx-auto">
                      <input
                        type="number"
                        value={mathQuestion.answer ?? ""}
                        onChange={(e) =>
                          setMathQuestion({ ...mathQuestion, answer: e.target.value })
                        }
                        onKeyDown={(e) => e.key === "Enter" && checkMathAnswer()}
                        className="flex-1 w-full px-8 h-20 text-4xl font-black text-center border-4 border-border/50 rounded-[2rem] bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                        placeholder="?"
                        autoFocus
                      />
                      <Button
                        onClick={checkMathAnswer}
                        size="lg"
                        className="h-20 px-12 rounded-[2rem] text-xl font-bold shadow-xl hover:shadow-primary/20 transition-all"
                      >
                        Check
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : activeGame === "word" ? (
              // ── Word Game ──
              <Card className="border-2 border-primary/10 shadow-2xl overflow-hidden rounded-[2.5rem]">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-8 p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <CardTitle className="text-3xl font-black tracking-tight">
                        Word Recall
                      </CardTitle>
                      <CardDescription className="text-base font-bold text-primary">
                        Memorize then reconstruct the sequence
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={startWordGame}
                        className="w-12 h-12 rounded-2xl border-2"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setActiveGame(null)}
                        className="h-12 px-6 rounded-2xl font-bold text-muted-foreground hover:text-destructive"
                      >
                        Exit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 md:p-12 space-y-10">
                  <div className="space-y-8">
                    <div
                      className={`p-10 rounded-[2.5rem] border-2 transition-all duration-500 ${wordPhase === "memorize" ? "bg-primary/5 border-primary/20 shadow-inner" : "bg-muted/30 border-dashed border-muted-foreground/20"}`}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                          <Lightbulb
                            className={`w-6 h-6 ${wordPhase === "memorize" ? "text-primary" : "text-muted-foreground"}`}
                          />
                          {wordPhase === "memorize" ? "Memorize these words:" : "Phase Complete"}
                        </h3>
                        {wordPhase === "memorize" && (
                          <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-primary text-white font-black shadow-lg">
                            <Clock className="w-5 h-5" />
                            <span className="text-lg">{timeLeft}s</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 justify-center">
                        <AnimatePresence mode="popLayout">
                          {wordPhase === "memorize" ? (
                            wordSequence.map((word, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="px-8 py-4 bg-white dark:bg-card border-2 border-primary/20 text-primary rounded-2xl font-black text-xl shadow-md"
                              >
                                {word}
                              </motion.div>
                            ))
                          ) : (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-center space-y-2"
                            >
                              <p className="text-2xl font-black text-foreground">
                                The words are now hidden!
                              </p>
                              <p className="text-muted-foreground font-medium">
                                Reconstruct the sequence in the correct order below.
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="p-10 bg-accent/10 border border-border/60 rounded-[2.5rem] shadow-sm">
                      <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                        <Zap className="w-6 h-6 text-orange-500" />
                        Available Word Bank
                      </h3>
                      <div className="flex flex-wrap gap-3 justify-center">
                        {healthWords.map((word, idx) => {
                          const alreadySelected = userSequence.some((w) => w.word === word);
                          return (
                            <Button
                              key={idx}
                              variant="outline"
                              disabled={alreadySelected}
                              className={`h-14 px-8 rounded-2xl font-bold text-lg border-2 transition-all ${
                                alreadySelected
                                  ? "opacity-20 scale-95 border-transparent bg-muted"
                                  : "hover:scale-105 hover:border-primary/50 hover:bg-primary/5 active:scale-95 shadow-sm"
                              }`}
                              onClick={() => {
                                if (wordPhase !== "recall") {
                                  showWarning("Wait!", "Memorize phase is still active");
                                  return;
                                }
                                setUserSequence([
                                  ...userSequence,
                                  { word, index: userSequence.length },
                                ]);
                              }}
                            >
                              {word}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reconstruct interface */}
                    <div className="p-10 bg-card border-2 border-primary/10 rounded-[3rem] shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Brain className="w-24 h-24 text-primary" />
                      </div>

                      <h3 className="text-2xl font-black mb-2 flex items-center gap-3 relative z-10">
                        Your Sequence
                        <span className="px-4 py-1 bg-primary/10 text-primary text-sm rounded-full font-black">
                          {userSequence.length} / {wordSequence.length}
                        </span>
                      </h3>
                      <p className="text-muted-foreground font-medium mb-10 relative z-10">
                        Drag to reorder words • Tap the "×" to remove
                      </p>

                      {userSequence.length === 0 ? (
                        <div className="h-32 border-2 border-dashed border-border rounded-[2rem] flex items-center justify-center text-muted-foreground font-medium">
                          Select words from the bank to start building your sequence
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-4 justify-center">
                          {userSequence.map((item, idx) => (
                            <motion.div
                              layout
                              key={`${item.word}-${idx}`}
                              draggable
                              onDragStart={() => setDragIndex(idx)}
                              onDragEnd={() => {
                                setDragIndex(null);
                                setDragOverIndex(null);
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                setDragOverIndex(idx);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (dragIndex === null || dragIndex === idx) {
                                  setDragIndex(null);
                                  setDragOverIndex(null);
                                  return;
                                }
                                const updated = [...userSequence];
                                const [moved] = updated.splice(dragIndex, 1);
                                updated.splice(idx, 0, moved);
                                setUserSequence(updated.map((w, i) => ({ ...w, index: i })));
                                setDragIndex(null);
                                setDragOverIndex(null);
                              }}
                              className={`group flex items-center gap-3 pl-5 pr-3 py-4 rounded-2xl font-black text-xl cursor-grab active:cursor-grabbing select-none transition-all shadow-md
                                ${dragIndex === idx ? "opacity-40 scale-95 ring-4 ring-primary/20" : "bg-primary/5 border border-primary/20 text-primary"}
                                ${dragOverIndex === idx && dragIndex !== idx ? "ring-4 ring-primary scale-105 bg-primary text-white" : ""}
                              `}
                            >
                              <span className="text-primary/30 font-serif mr-2">⠿</span>
                              <span className="text-sm opacity-50 mr-1">{idx + 1}.</span>
                              {item.word}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = userSequence
                                    .filter((_, i) => i !== idx)
                                    .map((w, i) => ({ ...w, index: i }));
                                  setUserSequence(updated);
                                }}
                                className="ml-3 w-8 h-8 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all text-sm"
                              >
                                ×
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto pt-6">
                      <Button
                        onClick={() => {
                          const correct =
                            wordSequence.length === userSequence.length &&
                            wordSequence.every((word, i) => word === userSequence[i].word);
                          if (correct) {
                            const recallXp = 40;
                            setXp((prev) => prev + recallXp);
                            showSuccess(
                              "🎉 PERFECT! 🎉",
                              `Exceptional memory recall! (+${recallXp} XP)`
                            );
                            triggerConfetti();
                          } else {
                            const correctCount = userSequence.filter(
                              (word, i) => word.word === wordSequence[i]
                            ).length;
                            showError(
                              "NOT QUITE",
                              `You got ${correctCount} out of ${wordSequence.length} correct`
                            );
                          }
                        }}
                        disabled={userSequence.length !== wordSequence.length}
                        className="flex-[2] h-16 rounded-2xl text-xl font-black shadow-xl hover:shadow-primary/20 transition-all"
                      >
                        Check Final Sequence
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setUserSequence([]);
                          showInfo("Reset", "Sequence cleared");
                        }}
                        className="flex-1 h-16 rounded-2xl font-bold border-2"
                      >
                        Clear All
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={startWordGame}
                        className="flex-1 h-16 rounded-2xl font-bold"
                      >
                        Restart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : activeGame === "pattern" ? (
              renderPatternGame()
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="pt-20 pb-10 text-center border-t border-border/50">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">
          Developed for Cognitive Excellence
        </p>
        <p className="text-xs text-muted-foreground/60">
          © 2026 Smart Health Tracker • All Rights Reserved
        </p>
      </footer>
    </div>
  );
};

export default BrainGames;
