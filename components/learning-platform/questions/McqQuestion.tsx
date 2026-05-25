"use client";

import { useState } from "react";
import type { Question } from "@/types/learning-platform";
import { MarkdownContent } from "../shared/MarkdownContent";

interface McqQuestionProps {
  question: Question;
  onAnswer: (selected: string, isCorrect: boolean) => void;
  disabled?: boolean;
  showFeedback?: boolean;
}

export function McqQuestion({
  question,
  onAnswer,
  disabled,
  showFeedback = true,
}: McqQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (option: string) => {
    if (submitted || disabled) return;
    setSelected(option);
    const isCorrect = option === question.correctAnswer;
    setSubmitted(true);
    onAnswer(option, isCorrect);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 min-h-[120px] flex items-center justify-center">
        <MarkdownContent className="text-lg text-center font-medium">
          {question.prompt}
        </MarkdownContent>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {(question.options || []).map((option) => {
          const isSelected = selected === option;
          const isCorrect = option === question.correctAnswer;
          let style = "border-border bg-card hover:bg-secondary/80";
          if (submitted && showFeedback) {
            if (isCorrect) style = "border-green-500 bg-green-500/15";
            else if (isSelected) style = "border-red-500 bg-red-500/15";
            else style = "border-border opacity-60";
          } else if (isSelected) {
            style = "border-foreground bg-secondary";
          }
          return (
            <button
              key={option}
              type="button"
              disabled={submitted || disabled}
              onClick={() => handleSelect(option)}
              className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${style}`}
            >
              <MarkdownContent className="text-sm">{option}</MarkdownContent>
            </button>
          );
        })}
      </div>
    </div>
  );
}
