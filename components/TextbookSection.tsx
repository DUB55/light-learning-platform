"use client";

import { useState, useMemo, memo, useCallback, useEffect } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ChevronDown, ChevronLeft, ChevronRight, RotateCcw, Shuffle, HelpCircle, Bookmark } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TextbookQuestion {
  id: string;
  /** Display number, e.g. "1a", "1b", "3", "6a" */
  number: string;
  /** The question text (supports Markdown / LaTeX) */
  text: string;
}

export interface TextbookAnswer {
  /** Must match a TextbookQuestion id */
  questionId: string;
  /** Display number, e.g. "1a" */
  number: string;
  /** The answer text (supports Markdown / LaTeX) */
  answer: string;
}

export interface TextbookBlock {
  id: string;
  type: "text" | "questions";
  /** Only for type "text": the long reading content (Markdown / LaTeX) */
  content?: string;
  /** Only for type "questions": optional intro sentence above the question list */
  intro?: string;
  /** Only for type "questions": the list of questions */
  questions?: TextbookQuestion[];
}

export interface TextbookSectionData {
  id: string;
  title: string;
  /** Ordered list of content blocks (text and question blocks interleaved) */
  blocks: TextbookBlock[];
  /** Answers for all questions in this section — rendered at the bottom */
  answers: TextbookAnswer[];
}

export type ViewMode = "book" | "study" | "simple" | "advanced";

interface TextbookSectionProps {
  section: TextbookSectionData;
  viewMode: ViewMode;
  bookmarks?: Set<string>;
  onToggleBookmark?: (blockId: string, title: string) => void;
  /** When true, show the answers panel at the bottom (book + simple modes) */
  showAnswers?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function processNewlines(text: string): string {
  return text.replace(/\\n/g, "\n");
}

/** Collect all questions from all question-blocks in a section */
function collectQuestions(section: TextbookSectionData): TextbookQuestion[] {
  return section.blocks.flatMap((b) => (b.type === "questions" ? b.questions ?? [] : []));
}

/** Build a lookup map from questionId → answer */
function buildAnswerMap(answers: TextbookAnswer[]): Map<string, TextbookAnswer> {
  if (!answers) return new Map();
  return new Map(answers.map((a) => [a.questionId, a]));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** A single collapsible answer row used in the answers panel */
const AnswerRow = memo(function AnswerRow({
  answer,
  question,
}: {
  answer: TextbookAnswer;
  question?: TextbookQuestion;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
      >
        <span className="font-mono text-sm text-muted-foreground min-w-[2.5rem] pt-0.5">
          {answer.number}
        </span>
        <span className="flex-1 text-sm text-foreground">
          {question ? processNewlines(question.text) : `Opgave ${answer.number}`}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-4 py-3 border-t border-border bg-background">
          <MarkdownRenderer className="text-sm text-muted-foreground leading-relaxed">
            {processNewlines(answer.answer)}
          </MarkdownRenderer>
        </div>
      )}
    </div>
  );
});

/** The answers panel rendered at the bottom of the page */
const AnswersPanel = memo(function AnswersPanel({
  section,
}: {
  section: TextbookSectionData;
}) {
  const { t } = useTranslation();
  const [allOpen, setAllOpen] = useState(false);
  const questionMap = useMemo(
    () => new Map(collectQuestions(section).map((q) => [q.id, q])),
    [section]
  );

  if (!section.answers || section.answers.length === 0) return null;

  return (
    <div
      id={`${section.id}-answers`}
      className="mt-12 pt-8 border-t-2 border-border scroll-mt-24"
    >
      <div className="mb-6">
        <h3 className="text-xl font-serif font-medium text-foreground">
          {t("answers", "Uitwerkingen")}
        </h3>
      </div>
      <div className="space-y-2">
        {section.answers.map((answer) => (
          <AnswerRow
            key={answer.questionId}
            answer={answer}
            question={questionMap.get(answer.questionId)}
          />
        ))}
      </div>
    </div>
  );
});

// ─── BOOK MODE ────────────────────────────────────────────────────────────────

const BookMode = memo(function BookMode({
  section,
  bookmarks,
  onToggleBookmark,
}: {
  section: TextbookSectionData;
  bookmarks?: Set<string>;
  onToggleBookmark?: (blockId: string, title: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      {section.blocks.map((block) => {
        if (block.type === "text") {
          return (
            <article
              key={block.id}
              id={block.id}
              className="bg-card border border-border rounded-lg px-6 sm:px-8 pb-6 sm:pb-8 shadow-sm scroll-mt-16"
              style={{ paddingTop: '0.5rem' }}
            >
              <MarkdownRenderer className="text-[17px] leading-[1.75] text-foreground">
                {processNewlines(block.content ?? "")}
              </MarkdownRenderer>
            </article>
          );
        }

        if (block.type === "questions") {
          return (
            <div
              key={block.id}
              id={block.id}
              className="scroll-mt-16"
            >
              {block.intro && (
                <p className="text-sm text-muted-foreground mb-4 italic">
                  {processNewlines(block.intro)}
                </p>
              )}
              <ol className="space-y-3">
                {(block.questions ?? []).map((q) => (
                  <li key={q.id} className="flex gap-3">
                    <span className="font-mono text-sm text-muted-foreground min-w-[2.5rem] pt-0.5">
                      {q.number}
                    </span>
                    <MarkdownRenderer className="text-sm text-foreground leading-relaxed flex-1">
                      {processNewlines(q.text)}
                    </MarkdownRenderer>
                  </li>
                ))}
              </ol>
            </div>
          );
        }

        return null;
      })}

      <AnswersPanel section={section} />
    </div>
  );
});

// ─── SIMPLE MODE ──────────────────────────────────────────────────────────────

const SimpleMode = memo(function SimpleMode({ section }: { section: TextbookSectionData }) {
  const { t } = useTranslation();

  return (
    <article className="max-w-3xl mx-auto space-y-10">
      {section.blocks.map((block) => {
        if (block.type === "text") {
          return (
            <div key={block.id} id={block.id} className="scroll-mt-16">
              <MarkdownRenderer className="text-[17px] leading-[1.75] text-foreground">
                {processNewlines(block.content ?? "")}
              </MarkdownRenderer>
            </div>
          );
        }

        if (block.type === "questions") {
          return (
            <div key={block.id} id={block.id} className="scroll-mt-16">
              {block.intro && (
                <p className="text-sm text-muted-foreground mb-3 italic">
                  {processNewlines(block.intro)}
                </p>
              )}
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {t("questions", "Opgaven")}
              </h4>
              <ol className="space-y-3">
                {(block.questions ?? []).map((q) => (
                  <li key={q.id} className="flex gap-3">
                    <span className="font-mono text-sm text-muted-foreground min-w-[2.5rem] pt-0.5">
                      {q.number}
                    </span>
                    <MarkdownRenderer className="text-sm text-foreground leading-relaxed flex-1">
                      {processNewlines(q.text)}
                    </MarkdownRenderer>
                  </li>
                ))}
              </ol>
            </div>
          );
        }

        return null;
      })}

      <AnswersPanel section={section} />
    </article>
  );
});

// ─── STUDY MODE (flashcard per question) ─────────────────────────────────────

const StudyMode = memo(function StudyMode({ section }: { section: TextbookSectionData }) {
  const { t } = useTranslation();
  const questions = useMemo(() => collectQuestions(section), [section]);
  const answerMap = useMemo(() => buildAnswerMap(section.answers), [section.answers]);

  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [order, setOrder] = useState<number[]>(() => questions.map((_, i) => i));

  const currentQ = questions[order[index]];
  const currentA = currentQ ? answerMap.get(currentQ.id) : undefined;
  const total = questions.length;

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setIndex((i) => (i + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const handleShuffle = useCallback(() => {
    setShuffled((s) => {
      if (!s) {
        setOrder((o) => [...o].sort(() => Math.random() - 0.5));
      } else {
        setOrder(questions.map((_, i) => i));
      }
      return !s;
    });
    setIndex(0);
    setIsFlipped(false);
  }, [questions]);

  const handleReset = useCallback(() => {
    setOrder(questions.map((_, i) => i));
    setShuffled(false);
    setIndex(0);
    setIsFlipped(false);
  }, [questions]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((v) => !v);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNext, handlePrev]);

  if (total === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("no_results", "Geen opgaven beschikbaar.")}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-serif font-medium text-foreground mb-1">
          {section.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("question", "Opgave")} {index + 1} {t("of", "van")} {total}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-secondary rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-foreground transition-all duration-300"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div
        onClick={() => setIsFlipped((v) => !v)}
        className="relative w-full cursor-pointer"
        style={{ perspective: "1000px", minHeight: "260px" }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "260px",
          }}
        >
          {/* Front – question */}
          <div
            className="absolute inset-0 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm flex flex-col"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              {t("question", "Opgave")} {currentQ?.number}
            </span>
            <div className="flex-1 flex items-center justify-center">
              <MarkdownRenderer className="text-lg sm:text-xl text-center text-foreground font-medium leading-relaxed">
                {processNewlines(currentQ?.text ?? "")}
              </MarkdownRenderer>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              {t("click_to_flip", "Klik om te omdraaien")}
            </p>
          </div>

          {/* Back – answer */}
          <div
            className="absolute inset-0 bg-secondary border border-border rounded-xl p-6 sm:p-8 shadow-sm flex flex-col"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              {t("answer", "Uitwerking")} {currentQ?.number}
            </span>
            <div className="flex-1 flex items-center justify-center overflow-y-auto">
              {currentA ? (
                <MarkdownRenderer className="text-base sm:text-lg text-foreground leading-relaxed">
                  {processNewlines(currentA.answer)}
                </MarkdownRenderer>
              ) : (
                <p className="text-muted-foreground italic text-sm">
                  {t("answer_not_provided_hint", "Geen uitwerking beschikbaar.")}
                </p>
              )}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              {t("click_to_flip", "Klik om te omdraaien")}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={handlePrev}
          className="p-3 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          title={t("previous_question", "Vorige")}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsFlipped((v) => !v)}
          className="px-6 py-3 rounded-full bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors"
        >
          {isFlipped ? t("show_question", "Toon opgave") : t("show_answer", "Toon uitwerking")}
        </button>
        <button
          onClick={handleNext}
          className="p-3 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          title={t("next_question", "Volgende")}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Extra controls */}
      <div className="flex items-center justify-center gap-3 mt-5">
        <button
          onClick={handleShuffle}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
            shuffled
              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30"
              : "bg-secondary hover:bg-secondary/80"
          }`}
        >
          <Shuffle className="w-4 h-4" />
          {shuffled ? t("shuffled", "Willekeurig") : t("shuffle", "Schud")}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          {t("reset", "Reset")}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {t("keyboard_hint", "Spatie = omdraaien · ← → = navigeren")}
      </p>
    </div>
  );
});

// ─── Main export ──────────────────────────────────────────────────────────────

export const TextbookSection = memo(function TextbookSection({
  section,
  viewMode,
  bookmarks,
  onToggleBookmark,
}: TextbookSectionProps) {
  const { t } = useTranslation();

  return (
    <section id={section.id} className="space-y-8 mb-16">
      {/* Section title */}
      <div className="pb-4 border-b border-border">
        <h2 className="text-2xl sm:text-3xl font-serif font-medium text-foreground">
          {section.title}
        </h2>
      </div>

      {viewMode === "book" && (
        <BookMode
          section={section}
          bookmarks={bookmarks}
          onToggleBookmark={onToggleBookmark}
        />
      )}

      {viewMode === "simple" && <SimpleMode section={section} />}

      {viewMode === "study" && <StudyMode section={section} />}

      {/* Advanced mode: delegate to AdvancedLearningSystem via parent */}
      {viewMode === "advanced" && (
        <div className="text-sm text-muted-foreground italic p-4 border border-border rounded-md">
          {t("advanced_mode_handled_by_parent", "Geavanceerde studiemodus wordt geladen…")}
        </div>
      )}
    </section>
  );
});
