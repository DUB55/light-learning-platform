"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLearningPlatformStore } from "@/store/useLearningPlatformStore";
import { getPromptAndAnswer } from "@/lib/learning-platform/term-filters";
import { useTranslation } from "@/lib/i18n";
import { MarkdownContent } from "../shared/MarkdownContent";

export function EnhancedFlashcardMode() {
  const { t } = useTranslation();
  const { playableTerms, settings, recordAnswer, beginSession, endSession } =
    useLearningPlatformStore();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [started, setStarted] = useState(false);

  const term = playableTerms[index];
  const total = playableTerms.length;

  useEffect(() => {
    if (!started && total > 0) {
      beginSession("flashcard", total);
      setStarted(true);
    }
  }, [started, total, beginSession]);

  const advance = useCallback(
    (knowIt: boolean) => {
      if (!term) return;
      recordAnswer(term.id, {
        questionType: "flashcard",
        userAnswer: knowIt ? "know-it" : "still-learning",
        correctAnswer: term.definition,
        isCorrect: knowIt,
        wasOverridden: false,
        timeSpent: 0,
      });
      setFlipped(false);
      if (index + 1 >= total) {
        endSession();
        setIndex(0);
      } else {
        setIndex((i) => i + 1);
      }
    },
    [term, index, total, recordAnswer, endSession]
  );

  const handlePrev = () => {
    setFlipped(false);
    setIndex((i) => (i - 1 + total) % total);
  };

  const handleNext = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % total);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  if (!term) {
    return (
      <p className="text-center text-muted-foreground py-12">No terms to study.</p>
    );
  }

  const { prompt, answer } = getPromptAndAnswer(term, settings.questionFormat);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <p className="text-center text-sm text-muted-foreground">
        Card {index + 1} of {total}
      </p>

      <div
        role="button"
        tabIndex={0}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setFlipped((f) => !f);
          }
        }}
        className="relative w-full aspect-[4/3] cursor-pointer"
        style={{ perspective: "1000px" }}
      >
        <div
          className="relative w-full h-full transition-transform duration-[400ms]"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div
            className="absolute inset-0 rounded-xl border border-border bg-card p-8 flex items-center justify-center shadow-sm"
            style={{ backfaceVisibility: "hidden" }}
          >
            <MarkdownContent className="text-xl text-center font-medium">
              {prompt}
            </MarkdownContent>
          </div>
          <div
            className="absolute inset-0 rounded-xl border border-border bg-secondary p-8 flex items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <MarkdownContent className="text-lg text-center">{answer}</MarkdownContent>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Space to flip · ← → to navigate
      </p>

      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={handlePrev}
          className="p-3 rounded-full bg-secondary hover:bg-secondary/80"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium"
        >
          {flipped ? t("flash_show_prompt", "Toon vraag") : t("flash_flip", "Draai om")}
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="p-3 rounded-full bg-secondary hover:bg-secondary/80"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {flipped && (
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => advance(false)}
            className="px-5 py-2.5 rounded-lg border border-red-500/50 text-red-700 dark:text-red-400 bg-red-500/10 text-sm font-medium"
          >
            {t("flash_still_learning", "Nog niet")}
          </button>
          <button
            type="button"
            onClick={() => advance(true)}
            className="px-5 py-2.5 rounded-lg border border-green-500/50 text-green-700 dark:text-green-400 bg-green-500/10 text-sm font-medium"
          >
            {t("flash_know_it", "Weet ik")}
          </button>
        </div>
      )}
    </div>
  );
}
