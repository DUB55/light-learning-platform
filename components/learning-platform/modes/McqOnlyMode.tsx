"use client";

import { useEffect, useState } from "react";
import { useLearningPlatformStore } from "@/store/useLearningPlatformStore";
import { buildMcqQuestion } from "@/lib/learning-platform/question-generator";
import type { Question } from "@/types/learning-platform";
import { McqQuestion } from "../questions/McqQuestion";

export function McqOnlyMode() {
  const { playableTerms, studySet, settings, recordAnswer, beginSession, endSession } =
    useLearningPlatformStore();
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  const allTerms = studySet?.terms ?? playableTerms;

  useEffect(() => {
    beginSession("multiple-choice-only", playableTerms.length);
  }, []);

  useEffect(() => {
    if (playableTerms[index]) {
      setQuestion(buildMcqQuestion(playableTerms[index], allTerms, settings));
    }
  }, [index, playableTerms, allTerms, settings]);

  const onAnswer = (answer: string, correct: boolean) => {
    if (!question) return;
    recordAnswer(question.term.id, {
      questionType: "multiple-choice",
      userAnswer: answer,
      correctAnswer: question.correctAnswer,
      isCorrect: correct,
      wasOverridden: false,
      timeSpent: 0,
    });
    setStats((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      total: s.total + 1,
    }));
    if (index + 1 >= playableTerms.length) {
      endSession(Math.round(((stats.correct + (correct ? 1 : 0)) / playableTerms.length) * 100));
    } else {
      setTimeout(() => setIndex((i) => i + 1), correct ? 400 : 1200);
    }
  };

  if (!question) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-center text-muted-foreground mb-4">
        {index + 1} / {playableTerms.length} · Accuracy{" "}
        {stats.total ? Math.round((stats.correct / stats.total) * 100) : 0}%
      </p>
      <McqQuestion key={question.id} question={question} onAnswer={onAnswer} />
    </div>
  );
}
