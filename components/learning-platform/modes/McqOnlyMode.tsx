"use client";

import { useEffect, useState } from "react";
import { useLearningPlatformStore } from "@/store/useLearningPlatformStore";
import { buildMcqQuestion } from "@/lib/learning-platform/question-generator";
import type { Question, TermResult } from "@/types/learning-platform";
import { McqQuestion } from "../questions/McqQuestion";
import { SessionSummary } from "../SessionSummary";

export function McqOnlyMode() {
  const { playableTerms, studySet, settings, recordAnswer, beginSession, endSession } =
    useLearningPlatformStore();
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [complete, setComplete] = useState(false);
  const [results, setResults] = useState<TermResult[]>([]);

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
    setResults((prev) => [
      ...prev,
      {
        termId: question.term.id,
        questionType: "multiple-choice",
        userAnswer: answer,
        correctAnswer: question.correctAnswer,
        isCorrect: correct,
        wasOverridden: false,
        timeSpent: 0,
        timestamp: new Date(),
      },
    ]);
    setStats((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      total: s.total + 1,
    }));
    if (index + 1 >= playableTerms.length) {
      endSession(Math.round(((stats.correct + (correct ? 1 : 0)) / playableTerms.length) * 100));
      setTimeout(() => setComplete(true), correct ? 1100 : 1700);
    } else {
      setTimeout(() => setIndex((i) => i + 1), correct ? 1100 : 1700);
    }
  };

  if (complete) {
    return (
      <div className="max-w-3xl mx-auto">
        <SessionSummary terms={studySet?.terms ?? playableTerms} results={results} />
      </div>
    );
  }

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
