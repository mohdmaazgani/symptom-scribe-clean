import React from "react";
import { Droplet } from "lucide-react";

interface WaterIntakeWidgetProps {
  intake: number;
  goal: number;
}

const WaterIntakeWidget: React.FC<WaterIntakeWidgetProps> = ({ intake, goal }) => {
  const percentage = Math.min((intake / goal) * 100, 100);

  return (
    <div className="relative flex flex-col items-center justify-center h-[220px] w-[180px] bg-slate-950/40 rounded-3xl border border-sky-500/10 overflow-hidden shadow-inner">
      <div
        className="absolute bottom-0 left-0 right-0 bg-sky-500/20 transition-all duration-700 ease-out flex items-center justify-center"
        style={{ height: `${percentage}%` }}
      >
        {percentage > 10 && (
          <div className="absolute top-2 left-0 right-0 h-2 bg-sky-400/20 animate-pulse" />
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-2">
        <div className="h-16 w-16 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400 shadow-md">
          <Droplet className="h-8 w-8 animate-bounce" />
        </div>
        <div className="text-center">
          <span className="text-3xl font-extrabold text-foreground">{percentage}%</span>
          <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">Hydrated</span>
        </div>
      </div>
    </div>
  );
};

export default WaterIntakeWidget;