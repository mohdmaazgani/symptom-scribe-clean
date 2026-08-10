import React from "react";
import { getCategoryByName } from "@/lib/symptom-categories";

interface CategoryBadgeProps {
  category?: string;
  className?: string;
  onClick?: () => void;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category = "General",
  className = "",
  onClick,
}) => {
  const cat = getCategoryByName(category);
  const color = cat.color || "#6b7280";

  return (
    <span
      onClick={onClick}
      style={{
        backgroundColor: `${color}20`,
        borderColor: `${color}50`,
        color: color,
      }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all ${
        onClick ? "cursor-pointer hover:opacity-80" : ""
      } ${className}`}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      {cat.name}
    </span>
  );
};
