import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { HelpCircle, RefreshCw, Award, Heart, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QuestionCard from "./components/QuestionCard";
import useQuizLogic from "./hooks/useQuizLogic";

const HealthQuiz: React.FC = () => {
  const { t } = useTranslation();
  const {
    currentStep,
    activeQuestion,
    totalQuestions,
    isCompleted,
    scores,
    handleAnswerSelect,
    resetQuiz,
  } = useQuizLogic();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="border-b pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-pink-500" />
            {t("sidebar.items.healthQuiz", "Health Risk Assessment Quiz")}
          </h1>
          <p className="text-muted-foreground mt-1">
            Participate in evidence-based lifestyle assessments to review your biological risk categories.
          </p>
        </div>
      </div>

      {!isCompleted ? (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-muted-foreground">Question {currentStep + 1} of {totalQuestions}</span>
            <Badge variant="outline" className="text-pink-500 border-pink-500/20">
              {Math.round(((currentStep) / totalQuestions) * 100)}% Complete
            </Badge>
          </div>
          
          <QuestionCard
            question={activeQuestion}
            onSelect={handleAnswerSelect}
          />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6 animate-scale-in">
          <Card className="border-pink-500/20 bg-pink-500/5">
            <CardHeader className="text-center">
              <Award className="h-16 w-16 text-pink-500 mx-auto mb-2 animate-bounce" />
              <CardTitle className="text-2xl text-foreground">Quiz Assessment Completed!</CardTitle>
              <CardDescription>Read your custom profile recommendations below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: "Cardiac Risk Index", score: scores.cardiac, label: scores.cardiac > 6 ? "High Risk" : scores.cardiac > 3 ? "Moderate Risk" : "Low Risk", color: scores.cardiac > 6 ? "text-red-500" : scores.cardiac > 3 ? "text-amber-500" : "text-green-500" },
                  { name: "Metabolic Index", score: scores.metabolic, label: scores.metabolic > 6 ? "High Risk" : scores.metabolic > 3 ? "Moderate Risk" : "Low Risk", color: scores.metabolic > 6 ? "text-red-500" : scores.metabolic > 3 ? "text-amber-500" : "text-green-500" },
                  { name: "General Wellness", score: scores.general, label: scores.general > 60 ? "Excellent" : scores.general > 30 ? "Good" : "Needs Care", color: "text-pink-500" },
                ].map((stat, idx) => (
                  <Card key={idx} className="p-4 text-center border-slate-800 bg-background/50">
                    <span className="text-xs text-muted-foreground uppercase font-bold block mb-1">{stat.name}</span>
                    <span className={`text-3xl font-extrabold ${stat.color} block`}>{stat.score}</span>
                    <Badge variant="secondary" className="mt-2">{stat.label}</Badge>
                  </Card>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold text-sm">Suggested Directives</h4>
                <div className="space-y-2">
                  {scores.cardiac > 3 && (
                    <div className="flex gap-3 text-sm p-3 border rounded-lg bg-amber-500/5 border-amber-500/20">
                      <Heart className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      <p className="text-foreground/80">Increase aerobic exercise count to 150 mins per week. Consult a GP to monitor blood pressure levels.</p>
                    </div>
                  )}
                  <div className="flex gap-3 text-sm p-3 border rounded-lg bg-green-500/5 border-green-500/20">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <p className="text-foreground/80">Maintain current hydration index. Your water target tracking is excellent.</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-4">
              <Button onClick={resetQuiz} className="bg-pink-600 hover:bg-pink-700 text-white">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HealthQuiz;