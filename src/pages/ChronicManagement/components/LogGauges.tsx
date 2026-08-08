import React from "react";

interface LogGaugesProps {
  glucose: number;
  bp: number;
}

const LogGauges: React.FC<LogGaugesProps> = ({ glucose, bp }) => {
  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      <div className="text-center p-3 border rounded-xl bg-slate-900/10 space-y-2">
        <span className="text-xs text-muted-foreground font-bold block uppercase tracking-wider">Average Glucose</span>
        <span className={`text-2xl font-extrabold block ${glucose > 140 ? "text-red-500" : "text-green-500"}`}>
          {glucose > 0 ? `${glucose} mg/dL` : "N/A"}
        </span>
        <span className="text-[9px] text-muted-foreground block">Target: 70-130 mg/dL</span>
      </div>

      <div className="text-center p-3 border rounded-xl bg-slate-900/10 space-y-2">
        <span className="text-xs text-muted-foreground font-bold block uppercase tracking-wider">Average BP</span>
        <span className={`text-2xl font-extrabold block ${bp > 130 ? "text-red-500" : "text-green-500"}`}>
          {bp > 0 ? `${bp} mmHg` : "N/A"}
        </span>
        <span className="text-[9px] text-muted-foreground block">Target: 90-120 mmHg</span>
      </div>
    </div>
  );
};

export default LogGauges;