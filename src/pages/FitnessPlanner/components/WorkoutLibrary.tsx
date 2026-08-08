import React from "react";
import { Dumbbell } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface Exercise {
  id: string;
  name: string;
  met: number;
  category: "cardio" | "strength" | "flexibility";
}

const EXERCISE_LIST: Exercise[] = [
  { id: "1", name: "Outdoor Jogging (Moderate)", met: 8.0, category: "cardio" },
  { id: "2", name: "Bicycling (12-14 mph)", met: 6.0, category: "cardio" },
  { id: "3", name: "Lap Swimming (Freestyle)", met: 7.0, category: "cardio" },
  { id: "4", name: "Weightlifting (Free weights)", met: 3.5, category: "strength" },
  { id: "5", name: "Hatha Yoga / Stretching", met: 2.5, category: "flexibility" },
];

interface WorkoutLibraryProps {
  selectedId: string | null;
  onSelect: (exercise: Exercise) => void;
}

const WorkoutLibrary: React.FC<WorkoutLibraryProps> = ({ selectedId, onSelect }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Exercise Directory</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXERCISE_LIST.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className={`p-4 border rounded-xl cursor-pointer transition-all hover:bg-amber-500/5 hover:border-amber-500/30 flex items-center gap-3 ${
              selectedId === item.id ? "border-amber-500 bg-amber-500/5" : "bg-background"
            }`}
          >
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-amber-500">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm block">{item.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{item.category} (MET: {item.met})</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default WorkoutLibrary;