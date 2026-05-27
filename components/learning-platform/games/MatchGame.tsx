"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fisherYatesShuffle } from "@/lib/learning-platform/term-filters";
import type { GameShellProps } from "@/lib/learning-platform/game-registry";
import { useLearningPlatformStore } from "@/store/useLearningPlatformStore";
import { useTranslation } from "@/lib/i18n";
import { MarkdownContent } from "../shared/MarkdownContent";
import { GameShell } from "../GameShell";

interface PairRow {
  termId: string;
  term: string;
  definition: string;
  matched: boolean;
}

export function MatchGame({ onQuit }: GameShellProps) {
  const { t } = useTranslation();
  const { playableTerms, recordAnswer, beginSession, endSession } = useLearningPlatformStore();
  const [pairs, setPairs] = useState<PairRow[]>([]);
  const [terms, setTerms] = useState<PairRow[]>([]);
  const [defs, setDefs] = useState<PairRow[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [selectedDefId, setSelectedDefId] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const [complete, setComplete] = useState(false);
  const reportRef = useRef<(n: number) => void>(() => {});
  const reportedRef = useRef(false);

  useEffect(() => {
    if (complete && !reportedRef.current) {
      reportedRef.current = true;
      reportRef.current(elapsed);
      endSession();
    }
  }, [complete, elapsed, endSession]);

  useEffect(() => {
    const rows: PairRow[] = playableTerms.slice(0, 8).map((t) => ({
      termId: t.id,
      term: t.term,
      definition: t.definition,
      matched: false,
    }));
    setPairs(rows);
    setTerms(fisherYatesShuffle([...rows]));
    setDefs(fisherYatesShuffle([...rows]));
    beginSession("match", rows.length);
  }, [playableTerms, beginSession]);

  useEffect(() => {
    if (!started || complete) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [started, complete]);

  const tryMatch = useCallback(
    (termId: string, defTermId: string) => {
      if (termId !== defTermId) {
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setSelectedTermId(null);
          setSelectedDefId(null);
        }, 600);
        return;
      }
      setPairs((prev) => {
        const next = prev.map((p) =>
          p.termId === termId ? { ...p, matched: true } : p
        );
        if (next.every((p) => p.matched)) {
          setComplete(true);
        }
        return next;
      });
      setTerms((prev) => prev.map((p) => (p.termId === termId ? { ...p, matched: true } : p)));
      setDefs((prev) => prev.map((p) => (p.termId === termId ? { ...p, matched: true } : p)));
      recordAnswer(termId, {
        questionType: "flashcard",
        userAnswer: "match",
        correctAnswer: "match",
        isCorrect: true,
        wasOverridden: false,
        timeSpent: 0,
      });
      setSelectedTermId(null);
      setSelectedDefId(null);
    },
    [recordAnswer]
  );

  useEffect(() => {
    if (selectedTermId && selectedDefId) {
      tryMatch(selectedTermId, selectedDefId);
    }
  }, [selectedTermId, selectedDefId, tryMatch]);

  return (
    <GameShell gameId="match" onQuit={onQuit}>
      {({ reportScore }) => {
        reportRef.current = reportScore;

        if (complete) {
          return (
            <div className="text-center py-12">
              <h3 className="text-xl font-serif">
                {t("study_match_done", "Alles gekoppeld!")}
              </h3>
              <p className="text-muted-foreground mt-2">
                {t("study_time", "Tijd")}: {elapsed}s
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-4 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{t("study_time", "Tijd")}: {elapsed}s</p>
              <p className="text-xs text-muted-foreground">
                {t("study_match_hint", "Klik een begrip en bijpassende definitie")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-center">
                  {t("study_terms_column", "Begrippen")}
                </h4>
                {terms.map((row) => (
                  <button
                    key={`t-${row.termId}`}
                    type="button"
                    disabled={row.matched}
                    onClick={() => {
                      if (!started) setStarted(true);
                      if (row.matched) return;
                      setSelectedTermId(row.termId);
                      setSelectedDefId(null);
                    }}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                      row.matched
                        ? "border-green-500/50 bg-green-500/10 opacity-60"
                        : selectedTermId === row.termId
                        ? "border-foreground bg-secondary"
                        : shake && selectedTermId === row.termId
                        ? "border-red-500 bg-red-500/10"
                        : "border-border bg-card hover:bg-secondary/50"
                    }`}
                  >
                    <MarkdownContent className="text-sm">{row.term}</MarkdownContent>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-center">
                  {t("study_defs_column", "Definities")}
                </h4>
                {defs.map((row) => (
                  <button
                    key={`d-${row.termId}`}
                    type="button"
                    disabled={row.matched}
                    onClick={() => {
                      if (!started) setStarted(true);
                      if (row.matched) return;
                      setSelectedDefId(row.termId);
                    }}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                      row.matched
                        ? "border-green-500/50 bg-green-500/10 opacity-60"
                        : selectedDefId === row.termId
                        ? "border-foreground bg-secondary"
                        : shake && selectedDefId === row.termId
                        ? "border-red-500 bg-red-500/10"
                        : "border-border bg-card hover:bg-secondary/50"
                    }`}
                  >
                    <MarkdownContent className="text-sm">{row.definition}</MarkdownContent>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      }}
    </GameShell>
  );
}
