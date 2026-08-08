import { useState } from "react";
import { Question } from "../components/QuestionCard";

const ASSESSMENT_QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "What is your weekly physical activity level?",
    category: "general",
    options: [
      { text: "Highly active: >150 mins moderate aerobic exercise", scoreValue: 20 },
      { text: "Moderately active: 60-150 mins per week", scoreValue: 10 },
      { text: "Sedentary: <60 mins of exercise", scoreValue: 2 },
    ],
  },
  {
    id: "q2",
    text: "How often do you consume processed foods or saturated fats?",
    category: "metabolic",
    options: [
      { text: "Rarely (less than once per week)", scoreValue: 1 },
      { text: "Sometimes (2-4 times per week)", scoreValue: 4 },
      { text: "Frequently (Daily)", scoreValue: 8 },
    ],
  },
  {
    id: "q3",
    text: "Do you have a parental or family history of high blood pressure or cardiac events?",
    category: "cardiac",
    options: [
      { text: "No family history of cardiac issues", scoreValue: 1 },
      { text: "One immediate relative with early cardiac event", scoreValue: 4 },
      { text: "Multiple relatives with cardiovascular symptoms", scoreValue: 8 },
    ],
  },
];

export const useQuizLogic = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [accumulatedScores, setAccumulatedScores] = useState({
    cardiac: 0,
    metabolic: 0,
    general: 0,
  });

  const handleAnswerSelect = (score: number) => {
    const question = ASSESSMENT_QUESTIONS[currentStep];
    
    setAccumulatedScores((prev) => ({
      ...prev,
      [question.category]: prev[question.category] + score,
    }));

    setCurrentStep((prev) => prev + 1);
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAccumulatedScores({ cardiac: 0, metabolic: 0, general: 0 });
  };

  const isCompleted = currentStep >= ASSESSMENT_QUESTIONS.length;

  return {
    currentStep,
    activeQuestion: ASSESSMENT_QUESTIONS[currentStep],
    totalQuestions: ASSESSMENT_QUESTIONS.length,
    isCompleted,
    scores: accumulatedScores,
    handleAnswerSelect,
    resetQuiz,
  };
};

export default useQuizLogic;