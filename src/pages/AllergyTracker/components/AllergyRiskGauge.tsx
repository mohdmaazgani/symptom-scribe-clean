import React from "react";

interface AllergyRiskGaugeProps {
  rating: "low" | "medium" | "high";
}

const AllergyRiskGauge: React.FC<AllergyRiskGaugeProps> = ({ rating }) => {
  const getAngle = () => {
    switch (rating) {
      case "low":
        return 45;
      case "medium":
        return 90;
      case "high":
        return 135;
      default:
        return 45;
    }
  };

  return (
    <div className="relative h-[120px] w-[200px] flex items-end justify-center overflow-hidden">
      <svg height="120" width="200" className="absolute bottom-0">
        {/* Color arc background */}
        <path
          d="M 20 120 A 80 80 0 0 1 180 120"
          fill="none"
          stroke="#1e293b"
          strokeWidth="14"
        />
        {/* Low segment */}
        <path
          d="M 20 120 A 80 80 0 0 1 73 64"
          fill="none"
          stroke="#22c55e"
          strokeWidth="14"
        />
        {/* Medium segment */}
        <path
          d="M 73 64 A 80 80 0 0 1 127 64"
          fill="none"
          stroke="#eab308"
          strokeWidth="14"
        />
        {/* High segment */}
        <path
          d="M 127 64 A 80 80 0 0 1 180 120"
          fill="none"
          stroke="#ef4444"
          strokeWidth="14"
        />
        {/* Center hub */}
        <circle cx="100" cy="120" r="10" fill="#cbd5e1" />
        {/* Needle */}
        <line
          x1="100"
          y1="120"
          x2="100"
          y2="50"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          className="transition-transform duration-500 ease-out origin-[100px_120px]"
          style={{ transform: `rotate(${getAngle() - 90}deg)` }}
        />
      </svg>
    </div>
  );
};

export default AllergyRiskGauge;