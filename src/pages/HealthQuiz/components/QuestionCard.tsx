import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface Question {
  id: string;
  text: string;
  category: "cardiac" | "metabolic" | "general";
  options: Array<{
    text: string;
    scoreValue: number;
  }>;
}

interface QuestionCardProps {
  question: Question;
  onSelect: (value: number) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onSelect }) => {
  return (
    <Card className="shadow-lg border-pink-500/10">
      <CardHeader className="border-b bg-pink-500/5">
        <span className="text-[10px] text-pink-500 uppercase font-bold tracking-wider">
          {question.category} Index Assessment
        </span>
        <CardTitle className="text-lg mt-1 text-foreground leading-relaxed">{question.text}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        {question.options.map((option, idx) => (
          <Button
            key={idx}
            type="button"
            variant="outline"
            className="w-full text-left justify-start py-4 px-4 h-auto text-sm transition-all hover:bg-pink-500/5 hover:border-pink-500/30 whitespace-normal"
            onClick={() => onSelect(option.scoreValue)}
          >
            {option.text}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuestionCard;