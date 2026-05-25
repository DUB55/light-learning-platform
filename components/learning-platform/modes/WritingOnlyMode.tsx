"use client";

import { useEffect, useState } from "react";
import { useLearningPlatformStore } from "@/store/useLearningPlatformStore";
import { buildWrittenQuestion } from "@/lib/learning-platform/question-generator";
import type { Question } from "@/types/learning-platform";
import { WrittenQuestion } from "../questions/WrittenQuestion";

export function WritingOnlyMode() {
  const { playableTerms, settings, recordAnswer, beginSession, endSession } =
    useLearningPlatformStore();
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    beginSession("writing-only", playableTerms.length);
  }, []);

  useEffect(() => {
    if (playableTerms[index]) {
      setQuestion(buildWrittenQuestion(playableTerms[index], settings));
    }
  }, [index, playableTerms, settings]);

  if (!question) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-center text-muted-foreground mb-4">
        {index + 1} / {playableTerms.length} · Accuracy{" "}
        {stats.total ? Math.round((stats.correct / stats.total) * 100) : 0}%
      </p>
      <WrittenQuestion
        key={question.id}
        question={question}
        smartGrading={settings.smartGrading}
        retypeAnswers={settings.retypeAnswers}
        onComplete={(answer, correct, overridden) => {
          recordAnswer(question.term.id, {
            questionType: "written",
            userAnswer: answer,
            correctAnswer: question.correctAnswer,
            isCorrect: correct || overridden,
            wasOverridden: overridden,
            timeSpent: 0,
          });
          setStats((s) => ({
            correct: s.correct + (correct || overridden ? 1 : 0),
            total: s.total + 1,
          }));
          if (index + 1 >= playableTerms.length) {
            endSession();
          } else {
            setIndex((i) => i + 1);
          }
        }}
      />
    </div>
  );
}
