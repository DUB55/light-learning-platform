"use client";

import { useEffect, useState } from "react";
import { useLearningPlatformStore } from "@/store/useLearningPlatformStore";
import { buildTestQuestions } from "@/lib/learning-platform/question-generator";
import type { Question } from "@/types/learning-platform";
import { McqQuestion } from "../questions/McqQuestion";
import { WrittenQuestion } from "../questions/WrittenQuestion";
import { TrueFalseQuestion } from "../questions/TrueFalseQuestion";
import { MarkdownContent } from "../shared/MarkdownContent";

export function TestMode() {
  const { playableTerms, studySet, settings, beginSession, endSession } =
    useLearningPlatformStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string; correct: boolean }>>({});
  const [phase, setPhase] = useState<"active" | "results">("active");

  useEffect(() => {
    const all = studySet?.terms ?? playableTerms;
    const qs = buildTestQuestions(playableTerms, all, settings);
    setQuestions(qs);
    beginSession("test", qs.length);
  }, []);

  const current = questions[index];

  const storeAnswer = (q: Question, answer: string, correct: boolean) => {
    const nextAnswers = { ...answers, [q.id]: { answer, correct } };
    setAnswers(nextAnswers);
    if (index + 1 >= questions.length) {
      const correctCount = Object.values(nextAnswers).filter((a) => a.correct).length;
      const score = Math.round((correctCount / questions.length) * 100);
      endSession(score);
      setPhase("results");
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (questions.length === 0) {
    return <p className="text-center text-muted-foreground">No questions generated.</p>;
  }

  if (phase === "results") {
    const correctCount = Object.values(answers).filter((a) => a.correct).length;
    const score = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center py-8 rounded-xl border border-border bg-card">
          <p className="text-4xl font-serif font-medium">{score}%</p>
          <p className="text-muted-foreground mt-2">
            {correctCount} / {questions.length} correct
          </p>
        </div>
        <h3 className="font-medium">Review</h3>
        <ul className="space-y-4">
          {questions.map((q) => {
            const a = answers[q.id];
            return (
              <li
                key={q.id}
                className={`rounded-lg border p-4 ${
                  a?.correct ? "border-green-500/30" : "border-red-500/30"
                }`}
              >
                <MarkdownContent className="text-sm mb-2">{q.prompt}</MarkdownContent>
                <p className="text-xs text-muted-foreground">
                  Your answer: {a?.answer ?? "—"}
                </p>
                {!a?.correct && (
                  <p className="text-xs mt-1 text-green-700 dark:text-green-400">
                    Correct: {q.correctAnswer}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Question {index + 1} of {questions.length} (no feedback until end)
      </p>
      {current.type === "multiple-choice" && (
        <McqQuestion
          question={current}
          showFeedback={false}
          onAnswer={(answer, correct) => storeAnswer(current, answer, correct)}
        />
      )}
      {current.type === "true-false" && (
        <TrueFalseQuestion
          question={current}
          onAnswer={(answer, correct) => storeAnswer(current, answer, correct)}
        />
      )}
      {current.type === "written" && (
        <WrittenQuestion
          question={current}
          smartGrading={settings.smartGrading}
          retypeAnswers={false}
          onComplete={(answer, correct) => storeAnswer(current, answer, correct)}
        />
      )}
    </div>
  );
}
