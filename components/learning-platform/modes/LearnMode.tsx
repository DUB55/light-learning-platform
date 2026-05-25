"use client";

import { useEffect, useRef, useState } from "react";
import { useLearningPlatformStore } from "@/store/useLearningPlatformStore";
import { buildLearnQuestion } from "@/lib/learning-platform/question-generator";
import type { Question, Term } from "@/types/learning-platform";
import { useTranslation } from "@/lib/i18n";
import { McqQuestion } from "../questions/McqQuestion";
import { WrittenQuestion } from "../questions/WrittenQuestion";

interface SessionTerm extends Term {
  sessionCorrect: number;
}

export function LearnMode() {
  const { t } = useTranslation();
  const {
    playableTerms,
    studySet,
    settings,
    progressMap,
    recordAnswer,
    beginSession,
    endSession,
  } = useLearningPlatformStore();

  const [queue, setQueue] = useState<SessionTerm[]>([]);
  const [current, setCurrent] = useState<Question | null>(null);
  const [complete, setComplete] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (playableTerms.length === 0) return;
    if (initialized.current) return;
    initialized.current = true;
    const sessionQueue: SessionTerm[] = playableTerms.map((term) => ({
      ...term,
      sessionCorrect: 0,
    }));
    setQueue(sessionQueue);
    setComplete(false);
    beginSession("learn", sessionQueue.length);
  }, [playableTerms, beginSession]);

  const allTerms = studySet?.terms ?? playableTerms;

  const pickNext = (terms: SessionTerm[]) => {
    const remaining = terms.filter((t) => t.sessionCorrect < 2);
    if (remaining.length === 0) {
      setComplete(true);
      endSession(100);
      setCurrent(null);
      return;
    }
    const term = remaining[0];
    const progress = progressMap[term.id];
    const consecutive = progress?.consecutiveCorrectCount ?? 0;
    setCurrent(buildLearnQuestion(term, allTerms, settings, consecutive));
  };

  useEffect(() => {
    if (queue.length > 0 && !current && !complete) {
      pickNext(queue);
    }
  }, [queue, current, complete]);

  const handleAnswer = (isCorrect: boolean, userAnswer: string, type: Question["type"]) => {
    if (!current) return;
    const t0 = current.startTime.getTime();
    recordAnswer(current.term.id, {
      questionType: type,
      userAnswer,
      correctAnswer: current.correctAnswer,
      isCorrect,
      wasOverridden: false,
      timeSpent: Date.now() - t0,
    });

    setQueue((prev) => {
      const updated = prev.map((t) =>
        t.id === current.term.id
          ? {
              ...t,
              sessionCorrect: isCorrect ? t.sessionCorrect + 1 : 0,
            }
          : t
      );
      setCurrent(null);
      setTimeout(() => pickNext(updated), 200);
      return updated;
    });
  };

  if (complete) {
    return (
      <div className="text-center py-12 space-y-4">
        <h3 className="text-xl font-serif font-medium">
          {t("study_round_done", "Ronde voltooid!")}
        </h3>
        <p className="text-muted-foreground">
          {t("study_round_done_desc", "Alle begrippen in deze ronde zijn beheerst.")}
        </p>
      </div>
    );
  }

  if (!current) {
    return (
      <p className="text-center py-8 text-muted-foreground">
        {t("study_loading", "Laden…")}
      </p>
    );
  }

  const left = queue.filter((t) => t.sessionCorrect < 2).length;

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-muted-foreground mb-4 text-center">
        {left} {t("study_terms_remaining", "begrippen te gaan")}
      </p>
      {current.type === "written" ? (
        <WrittenQuestion
          question={current}
          smartGrading={settings.smartGrading}
          retypeAnswers={settings.retypeAnswers}
          onComplete={(answer, correct, overridden) =>
            handleAnswer(correct || overridden, answer, "written")
          }
        />
      ) : (
        <McqQuestion
          question={current}
          onAnswer={(answer, correct) => handleAnswer(correct, answer, "multiple-choice")}
        />
      )}
    </div>
  );
}
