import { useState, useEffect, useRef } from "react";

export const useMindfulnessTimer = (pattern: string) => {
  const [phase, setPhase] = useState<"idle" | "inhale" | "hold" | "exhale">("idle");
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const timerRef = useRef<any>(null);

  const getNextPhase = (current: string) => {
    if (pattern === "box") {
      switch (current) {
        case "idle":
          return { next: "inhale" as const, time: 4 };
        case "inhale":
          return { next: "hold" as const, time: 4 };
        case "hold":
          return { next: "exhale" as const, time: 4 };
        case "exhale":
          return { next: "hold" as const, time: 4 }; // box has a post-exhale hold
        default:
          return { next: "inhale" as const, time: 4 };
      }
    } else {
      // 4-7-8 pattern
      switch (current) {
        case "idle":
          return { next: "inhale" as const, time: 4 };
        case "inhale":
          return { next: "hold" as const, time: 7 };
        case "hold":
          return { next: "exhale" as const, time: 8 };
        case "exhale":
          return { next: "inhale" as const, time: 4 };
        default:
          return { next: "inhale" as const, time: 4 };
      }
    }
  };

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (phase === "idle") {
      setPhase("inhale");
      setSecondsLeft(4);
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setPhase((curr) => {
            const nextConf = getNextPhase(curr);
            if (curr === "exhale") {
              setCyclesCompleted((c) => c + 1);
            }
            // Set seconds left for next phase
            setTimeout(() => setSecondsLeft(nextConf.time), 0);
            return nextConf.next;
          });
          return 1;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phase, pattern]);

  const toggleTimer = () => {
    setIsActive((prev) => !prev);
  };

  const resetTimer = () => {
    setIsActive(false);
    setPhase("idle");
    setSecondsLeft(4);
    setCyclesCompleted(0);
  };

  return {
    phase,
    secondsLeft,
    cyclesCompleted,
    isActive,
    toggleTimer,
    resetTimer,
  };
};

export default useMindfulnessTimer;