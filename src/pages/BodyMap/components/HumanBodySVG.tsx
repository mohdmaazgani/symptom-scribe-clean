import React from "react";

interface HumanBodySVGProps {
  activeRegion: string | null;
  isFront: boolean;
  onRegionSelect: (region: string) => void;
}

const HumanBodySVG: React.FC<HumanBodySVGProps> = ({ activeRegion, isFront, onRegionSelect }) => {
  const getRegionClass = (region: string) => {
    const isActive = activeRegion === region;
    return `cursor-pointer transition-all duration-300 fill-slate-800 stroke-slate-700 hover:fill-indigo-500/30 hover:stroke-indigo-400 ${
      isActive ? "fill-indigo-500/55 stroke-indigo-500 scale-[1.01]" : ""
    }`;
  };

  return (
    <svg
      viewBox="0 0 100 240"
      className="w-full h-auto drop-shadow-[0_0_15px_rgba(99,102,241,0.1)]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="0" width="100" height="240" rx="16" fill="transparent" />

      <path
        d="M 50 15 C 44 15, 41 20, 41 26 C 41 33, 44 38, 50 38 C 56 38, 59 33, 59 26 C 59 20, 56 15, 50 15 Z"
        className={getRegionClass("head")}
        onClick={() => onRegionSelect("head")}
        data-testid="body-region-head"
      />

      {isFront ? (
        <path
          d="M 37 42 L 63 42 L 61 75 L 39 75 Z"
          className={getRegionClass("chest")}
          onClick={() => onRegionSelect("chest")}
          data-testid="body-region-chest"
        />
      ) : (
        <path
          d="M 37 42 L 63 42 L 61 75 L 39 75 Z"
          className={getRegionClass("spine-upper")}
          onClick={() => onRegionSelect("spine-upper")}
          data-testid="body-region-spine-upper"
        />
      )}

      {isFront ? (
        <path
          d="M 39 77 L 61 77 L 59 108 L 41 108 Z"
          className={getRegionClass("abdomen")}
          onClick={() => onRegionSelect("abdomen")}
          data-testid="body-region-abdomen"
        />
      ) : (
        <path
          d="M 39 77 L 61 77 L 59 108 L 41 108 Z"
          className={getRegionClass("lower-back")}
          onClick={() => onRegionSelect("lower-back")}
          data-testid="body-region-lower-back"
        />
      )}

      <path
        d="M 35 42 L 23 75 L 18 110 L 25 110 L 30 75 L 35 55 Z"
        className={getRegionClass("arms")}
        onClick={() => onRegionSelect("arms")}
        data-testid="body-region-arms"
      />
      <path
        d="M 65 42 L 77 75 L 82 110 L 75 110 L 70 75 L 65 55 Z"
        className={getRegionClass("arms")}
        onClick={() => onRegionSelect("arms")}
      />

      <path
        d="M 39 110 L 49 110 L 45 170 L 42 220 L 35 220 L 39 170 Z"
        className={getRegionClass("legs")}
        onClick={() => onRegionSelect("legs")}
        data-testid="body-region-legs"
      />
      <path
        d="M 51 110 L 61 110 L 57 170 L 54 220 L 47 220 L 51 170 Z"
        className={getRegionClass("legs")}
        onClick={() => onRegionSelect("legs")}
      />

      <text x="50" y="29" textAnchor="middle" fill="#ffffff" className="text-[4px] pointer-events-none select-none font-bold">
        HEAD
      </text>
      <text x="50" y="60" textAnchor="middle" fill="#ffffff" className="text-[4px] pointer-events-none select-none font-bold">
        {isFront ? "CHEST" : "UPPER BACK"}
      </text>
      <text x="50" y="94" textAnchor="middle" fill="#ffffff" className="text-[4px] pointer-events-none select-none font-bold">
        {isFront ? "ABDOMEN" : "SPINE"}
      </text>
      <text x="25" y="85" textAnchor="middle" fill="#ffffff" className="text-[4px] pointer-events-none select-none font-bold">
        ARMS
      </text>
      <text x="75" y="85" textAnchor="middle" fill="#ffffff" className="text-[4px] pointer-events-none select-none font-bold">
        ARMS
      </text>
      <text x="50" y="165" textAnchor="middle" fill="#ffffff" className="text-[4px] pointer-events-none select-none font-bold">
        LEGS
      </text>
    </svg>
  );
};

export default HumanBodySVG;