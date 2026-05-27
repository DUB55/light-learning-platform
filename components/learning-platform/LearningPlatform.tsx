"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Brain,
  ChevronRight,
  ClipboardList,
  Gamepad2,
  List,
  Star,
} from "lucide-react";
import { buildStudySetFromSections } from "@/lib/learning-platform/study-set";
import { STUDY_GAMES, getGameById } from "@/lib/learning-platform/game-registry";
import { useLearningPlatformStore } from "@/store/useLearningPlatformStore";
import type { LearningMode } from "@/types/learning-platform";
import { useTranslation } from "@/lib/i18n";
import { SessionSettingsPanel } from "./SessionSettingsPanel";
import { MasteryProgressBar } from "./MasteryProgressBar";
import { TermList } from "./TermList";
import { LearnMode } from "./modes/LearnMode";
import { TestMode } from "./modes/TestMode";
import { RegisteredGameView } from "./GameShell";

interface SourceSection {
  id: string;
  title: string | string[];
  titles?: string[];
  chapterTitles?: string[];
  paragraphs?: Array<{
    questions?: Array<{
      id: string;
      number?: string;
      question: string;
      answer: string;
    }>;
  }>;
  blocks?: Array<{
    type?: string;
    questions?: Array<{ id: string; text?: string; question?: string }>;
  }>;
  answers?: Array<{ questionId: string; answer: string }>;
}

interface LearningPlatformProps {
  pageId: string;
  sections: SourceSection[];
}

type HubScreen = "home" | "leren-setup" | "test-setup" | "games" | "terms" | "playing";

function HubButton({
  label,
  description,
  icon,
  onClick,
}: {
  label: string;
  description?: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 p-5 rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors text-left group"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-base text-foreground">{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground shrink-0" />
    </button>
  );
}

function LerenModeView() {
  return <LearnMode />;
}

function StudyModeView({ mode }: { mode: LearningMode }) {
  if (getGameById(mode)) {
    return null;
  }
  if (mode === "test") return <TestMode />;
  return <LerenModeView />;
}

export function LearningPlatform({ pageId, sections }: LearningPlatformProps) {
  const { t } = useTranslation();
  const {
    init,
    studySet,
    activeMode,
    setActiveMode,
    refreshPlayableTerms,
    saveSettingsToStorage,
    initialized,
  } = useLearningPlatformStore();
  const [screen, setScreen] = useState<HubScreen>("home");

  useEffect(() => {
    const set = buildStudySetFromSections(sections, pageId);
    if (set) init(set);
    setScreen("home");
    setActiveMode(null);
    return () => setActiveMode(null);
  }, [pageId, sections, init, setActiveMode]);

  useEffect(() => {
    if (initialized) refreshPlayableTerms();
  }, [initialized, refreshPlayableTerms]);

  const startLeren = () => {
    refreshPlayableTerms();
    saveSettingsToStorage();
    setActiveMode("learn");
    setScreen("playing");
  };

  const startTest = () => {
    refreshPlayableTerms();
    saveSettingsToStorage();
    setActiveMode("test");
    setScreen("playing");
  };

  const startGame = (gameId: LearningMode) => {
    setActiveMode(gameId);
    setScreen("playing");
  };

  const goBackFromPlaying = () => {
    const mode = activeMode;
    setActiveMode(null);
    if (mode === "test") setScreen("home");
    else if (mode && getGameById(mode)) setScreen("games");
    else setScreen("home");
  };

  if (!studySet) {
    return (
      <p className="text-center py-12 text-muted-foreground">
        {t("study_no_terms", "Geen studiemateriaal gevonden op deze pagina.")}
      </p>
    );
  }

  const termCount = studySet.terms.length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-serif font-medium text-foreground">
          {studySet.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {termCount} {t("study_terms_count", "begrippen")}
        </p>
      </div>

      <MasteryProgressBar terms={studySet.terms} />

      {screen === "playing" && activeMode ? (
        <div className="space-y-4">
          {getGameById(activeMode) ? (
            <RegisteredGameView gameId={activeMode} onQuit={goBackFromPlaying} />
          ) : (
            <>
              <button
                type="button"
                onClick={goBackFromPlaying}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("study_back", "Terug")}
              </button>
              <StudyModeView key={activeMode} mode={activeMode} />
            </>
          )}
        </div>
      ) : screen === "leren-setup" ? (
        <SessionSettingsPanel
          preset="leren"
          onBack={() => setScreen("home")}
          onStart={startLeren}
        />
      ) : screen === "test-setup" ? (
        <SessionSettingsPanel
          preset="test"
          onBack={() => setScreen("home")}
          onStart={startTest}
        />
      ) : screen === "terms" ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setScreen("home")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("study_back_home", "Terug naar menu")}
          </button>
          <h3 className="text-lg font-medium text-center">
            {t("study_begrippenlijst", "Begrippenlijst")}
          </h3>
          <TermList terms={studySet.terms} />
        </div>
      ) : screen === "games" ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setScreen("home")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("study_back_home", "Terug naar menu")}
          </button>
          <h3 className="text-lg font-medium text-center">
            {t("study_spelletjes", "Spelletjes")}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STUDY_GAMES.map((game) => {
              const Icon = game.icon;
              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => startGame(game.id)}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-md"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-background text-foreground shadow-sm group-hover:bg-foreground group-hover:text-background transition-colors">
                    <Icon className="h-7 w-7" />
                  </span>
                  <span className="text-sm font-medium text-center">
                    {t(game.labelKey, game.fallback)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center mb-4">
            {t("study_choose_activity", "Kies wat je wilt doen")}
          </p>
          <HubButton
            label={t("study_leren", "Leren")}
            description={t("study_leren_desc", "Kies hoe je oefent en start meteen")}
            icon={<Brain className="h-6 w-6" />}
            onClick={() => setScreen("leren-setup")}
          />
          <HubButton
            label={t("study_oefentoets", "Oefentoets")}
            description={t("study_oefentoets_desc", "Stel je toets in en ontvang een score")}
            icon={<ClipboardList className="h-6 w-6" />}
            onClick={() => setScreen("test-setup")}
          />
          <HubButton
            label={t("study_spelletjes", "Spelletjes")}
            description={t("study_spelletjes_desc", "Leer spelenderwijs met minigames")}
            icon={<Gamepad2 className="h-6 w-6" />}
            onClick={() => setScreen("games")}
          />
          <HubButton
            label={t("study_begrippenlijst", "Begrippenlijst")}
            description={t("study_begrippenlijst_desc", "Bekijk begrippen en markeer met een ster")}
            icon={<List className="h-6 w-6" />}
            onClick={() => setScreen("terms")}
          />
        </div>
      )}
    </div>
  );
}
