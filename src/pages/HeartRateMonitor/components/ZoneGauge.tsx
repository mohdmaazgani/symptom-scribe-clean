import React from "react";

interface Zone { label: string; color: string; description: string; }
interface ZoneGaugeProps { bpm: number; age: number; zone: Zone; }

const ZoneGauge: React.FC<ZoneGaugeProps> = ({ bpm, age, zone }) => {
  const maxHR = 220 - age;
  const percentage = Math.min((bpm / maxHR) * 100, 100);

  return (
    <div className="p-3 rounded-lg border" style={{ borderColor: zone.color + "33", backgroundColor: zone.color + "11" }}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold" style={{ color: zone.color }}>{zone.label}</span>
        <span className="text-xs text-muted-foreground">{bpm}/{maxHR} max HR</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: zone.color }} />
      </div>
      <p className="text-xs text-muted-foreground mt-2">{zone.description}</p>
    </div>
  );
};

export default ZoneGauge;
