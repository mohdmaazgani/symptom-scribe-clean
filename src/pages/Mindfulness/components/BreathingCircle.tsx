import React from "react";
import { motion } from "framer-motion";

interface BreathingCircleProps {
  phase: "inhale" | "hold" | "exhale" | "idle";
}

const BreathingCircle: React.FC<BreathingCircleProps> = ({ phase }) => {
  const getScale = () => {
    switch (phase) {
      case "inhale":
        return 1.4;
      case "hold":
        return 1.4;
      case "exhale":
        return 1.0;
      default:
        return 1.0;
    }
  };

  const getColor = () => {
    switch (phase) {
      case "inhale":
        return "rgba(56, 189, 248, 0.4)";
      case "hold":
        return "rgba(129, 140, 248, 0.4)";
      case "exhale":
        return "rgba(14, 165, 233, 0.4)";
      default:
        return "rgba(148, 163, 184, 0.2)";
    }
  };

  return (
    <div className="h-[180px] w-[180px] flex items-center justify-center relative">
      <motion.div
        animate={{
          scale: getScale(),
          backgroundColor: getColor(),
        }}
        transition={{
          duration: phase === "hold" ? 0.2 : 4,
          ease: "easeInOut",
        }}
        className="h-28 w-28 rounded-full flex items-center justify-center text-foreground font-bold shadow-lg"
      >
        <span className="text-xs uppercase tracking-widest text-slate-100 drop-shadow-md">
          {phase === "idle" ? "Ready" : phase}
        </span>
      </motion.div>
    </div>
  );
};

export default BreathingCircle;