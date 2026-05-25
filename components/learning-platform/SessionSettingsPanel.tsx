"use client";

import { ArrowLeft } from "lucide-react";
import { useLearningPlatformStore } from "@/store/useLearningPlatformStore";
import { daysUntilExam } from "@/lib/learning-platform/term-filters";
import type { LerenActivity, QuestionType, StudySettings } from "@/types/learning-platform";
import { useTranslation } from "@/lib/i18n";
import { Toggle } from "./ui/Toggle";

export type SessionPreset = "leren" | "test";

interface SessionSettingsPanelProps {
  preset: SessionPreset;
  onBack: () => void;
  onStart: () => void;
}

const LEREN_ACTIVITIES: { id: LerenActivity; label: string }[] = [
  { id: "flashcard", label: "Flashcards" },
  { id: "learn", label: "Adaptief leren" },
  { id: "multiple-choice-only", label: "Meerkeuze" },
  { id: "writing-only", label: "Schrijven" },
];

export function SessionSettingsPanel({ preset, onBack, onStart }: SessionSettingsPanelProps) {
  const { t } = useTranslation();
  const { settings, updateSettings, refreshPlayableTerms } = useLearningPlatformStore();

  const daysLeft = daysUntilExam(settings.examDate);
  const isTest = preset === "test";

  const toggleQuestionType = (type: QuestionType) => {
    const set = new Set(settings.enabledQuestionTypes);
    if (set.has(type)) set.delete(type);
    else set.add(type);
    if (set.size === 0) return;
    updateSettings({ enabledQuestionTypes: Array.from(set) });
  };

  const handleStart = () => {
    refreshPlayableTerms();
    onStart();
  };

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("study_back_home", "Terug naar menu")}
      </button>

      <div className="text-center">
        <h3 className="text-xl font-serif font-medium text-foreground">
          {isTest
            ? t("study_settings_test_title", "Instellingen oefentoets")
            : t("study_settings_leren_title", "Instellingen leersessie")}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t("study_settings_subtitle", "Stel je sessie in en klik op Start")}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border px-4">
        {!isTest && (
          <div className="py-4 space-y-2">
            <p className="text-sm font-medium text-foreground">
              {t("study_activity_type", "Leermodus")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {LEREN_ACTIVITIES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => updateSettings({ lerenActivity: a.id })}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    settings.lerenActivity === a.id
                      ? "border-foreground bg-secondary text-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-secondary/50"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="py-4 space-y-2">
          <label className="text-sm font-medium text-foreground">
            {t("study_exam_date", "Examendatum")}
          </label>
          <input
            type="date"
            value={
              settings.examDate
                ? new Date(settings.examDate).toISOString().slice(0, 10)
                : ""
            }
            onChange={(e) =>
              updateSettings({
                examDate: e.target.value ? new Date(e.target.value) : undefined,
              })
            }
            className="w-full rounded-lg border border-border px-3 py-2.5 bg-background text-foreground text-sm"
          />
          {daysLeft !== null && (
            <p className="text-xs text-muted-foreground">
              {daysLeft} {t("study_days_left", "dagen resterend")}
              {daysLeft < 3 && ` — ${t("study_exam_priority", "prioriteit voor niet-beheerste begrippen")}`}
            </p>
          )}
        </div>

        <div className="py-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-foreground">
              {t("study_round_length", "Aantal begrippen per ronde")}
            </span>
            <span className="text-muted-foreground">
              {settings.roundLength === "all"
                ? t("study_all_terms", "Alle")
                : settings.roundLength}
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={settings.roundLength === "all" ? 50 : settings.roundLength}
            onChange={(e) => {
              const v = Number(e.target.value);
              updateSettings({ roundLength: v >= 50 ? "all" : v });
            }}
            className="w-full accent-foreground"
          />
        </div>

        {isTest && (
          <div className="py-4 space-y-3">
            <p className="text-sm font-medium text-foreground">
              {t("study_question_types", "Vraagtypen")}
            </p>
            {(
              [
                ["multiple-choice", "Meerkeuze"],
                ["written", "Schrijven"],
                ["true-false", "Waar / onwaar"],
              ] as [QuestionType, string][]
            ).map(([type, label]) => (
              <Toggle
                key={type}
                label={label}
                checked={settings.enabledQuestionTypes.includes(type)}
                onChange={() => toggleQuestionType(type)}
              />
            ))}
            <p className="text-sm font-medium text-foreground pt-2">
              {t("study_test_mix", "Verdeling oefentoets (%)")}
            </p>
            {(
              [
                ["true-false", "Waar / onwaar"],
                ["multiple-choice", "Meerkeuze"],
                ["written", "Schrijven"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center gap-3 text-sm">
                <span className="w-28 text-muted-foreground">{label}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.testQuestionDistribution?.[key] ?? 0}
                  onChange={(e) =>
                    updateSettings({
                      testQuestionDistribution: {
                        ...settings.testQuestionDistribution!,
                        [key]: Number(e.target.value),
                      },
                    })
                  }
                  className="w-20 rounded-lg border border-border px-2 py-1.5 bg-background"
                />
              </div>
            ))}
          </div>
        )}

        <div className="py-4 space-y-1">
          <p className="text-sm font-medium text-foreground mb-2">
            {t("study_prompt_format", "Vraagformaat")}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateSettings({ questionFormat: "term-to-definition" })}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                settings.questionFormat === "term-to-definition"
                  ? "border-foreground bg-secondary"
                  : "border-border hover:bg-secondary/50"
              }`}
            >
              {t("study_answer_definition", "Antwoord = definitie")}
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ questionFormat: "definition-to-term" })}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                settings.questionFormat === "definition-to-term"
                  ? "border-foreground bg-secondary"
                  : "border-border hover:bg-secondary/50"
              }`}
            >
              {t("study_answer_term", "Antwoord = begrip")}
            </button>
          </div>
        </div>

        <div className="py-2 divide-y divide-border">
          <Toggle
            label={t("study_starred_only", "Alleen gemarkeerde begrippen")}
            checked={settings.studyStarredOnly}
            onChange={(v) => updateSettings({ studyStarredOnly: v })}
          />
          <Toggle
            label={t("study_shuffle", "Begrippen shufflen")}
            checked={settings.shuffleTerms}
            onChange={(v) => updateSettings({ shuffleTerms: v })}
          />
          <Toggle
            label={t("study_smart_grading", "Slimme beoordeling (typfouten tolereren)")}
            checked={settings.smartGrading}
            onChange={(v) => updateSettings({ smartGrading: v })}
          />
          <Toggle
            label={t("study_retype", "Juiste antwoord overtypen bij fout")}
            checked={settings.retypeAnswers}
            onChange={(v) => updateSettings({ retypeAnswers: v })}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleStart}
        className="w-full py-3.5 rounded-xl bg-foreground text-background font-medium text-base hover:opacity-90 transition-opacity"
      >
        {t("study_start_session", "Start sessie")}
      </button>
    </div>
  );
}
