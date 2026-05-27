"use client";

import { ArrowLeft, Check, Circle } from "lucide-react";
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
  { id: "multiple-choice-only", label: "Meerkeuze" },
  { id: "learn", label: "Adaptief leren" },
  { id: "writing-only", label: "Schrijven" },
];

export function SessionSettingsPanel({ preset, onBack, onStart }: SessionSettingsPanelProps) {
  const { t } = useTranslation();
  const { studySet, settings, updateSettings, refreshPlayableTerms } = useLearningPlatformStore();

  const isTest = preset === "test";
  const daysLeft = daysUntilExam(settings.examDate);
  const selectedSetIds = settings.selectedLearningSetIds ?? [];
  const allLearningSets = studySet?.learningSets ?? [];
  const selectedActivities = settings.lerenActivities?.length
    ? settings.lerenActivities
    : [settings.lerenActivity ?? "learn"];

  const toggleQuestionType = (type: QuestionType) => {
    const set = new Set(settings.enabledQuestionTypes);
    if (set.has(type)) set.delete(type);
    else set.add(type);
    if (set.size === 0) return;
    updateSettings({ enabledQuestionTypes: Array.from(set) });
  };

  const toggleActivity = (id: LerenActivity) => {
    const selected = new Set(selectedActivities);
    if (selected.has(id)) {
      if (selected.size === 1) return;
      selected.delete(id);
    } else {
      selected.add(id);
    }
    const next = Array.from(selected);
    updateSettings({ lerenActivities: next, lerenActivity: next[0] });
  };

  const toggleLearningSet = (id: string) => {
    const selected = new Set(selectedSetIds);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    updateSettings({ selectedLearningSetIds: Array.from(selected) });
  };

  const setQuestionFormat = (format: StudySettings["questionFormat"], checked: boolean) => {
    if (!checked) return;
    updateSettings({ questionFormat: format });
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
        <p className="mt-1 text-sm text-muted-foreground">
          {t("study_settings_subtitle", "Kies wat je wilt oefenen en druk op Starten")}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card px-4 divide-y divide-border">
        {allLearningSets.length > 1 && (
          <div className="py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">
                {t("study_learning_sets", "Kies hoofdstukken")}
              </p>
              <button
                type="button"
                onClick={() => updateSettings({ selectedLearningSetIds: [] })}
                className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {t("study_all_sets", "Alles oefenen")}
              </button>
            </div>
            <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-border bg-background px-3 divide-y divide-border">
              {allLearningSets.map((set) => {
                const checked = selectedSetIds.length === 0 || selectedSetIds.includes(set.id);
                return (
                  <button
                    key={set.id}
                    type="button"
                    onClick={() => toggleLearningSet(set.id)}
                    className={`flex w-full items-center justify-between gap-4 py-3 text-left transition-colors ${
                      checked ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{set.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {set.termCount} {t("study_terms_count", "begrippen")}
                      </span>
                    </span>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        checked
                          ? "border-foreground bg-foreground text-background"
                          : "border-muted-foreground/40 bg-background"
                      }`}
                    >
                      {checked ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2 opacity-30" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isTest && (
          <div className="py-4 space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t("study_exam_date", "Examendatum")}
            </label>
            <input
              type="date"
              value={settings.examDate ? new Date(settings.examDate).toISOString().slice(0, 10) : ""}
              onChange={(event) =>
                updateSettings({
                  examDate: event.target.value ? new Date(event.target.value) : undefined,
                })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
            />
            {daysLeft !== null && (
              <p className="text-xs text-muted-foreground">
                {daysLeft} {t("study_days_left", "dagen resterend")}
                {daysLeft < 3 && ` - ${t("study_exam_priority", "prioriteit voor niet-beheerste begrippen")}`}
              </p>
            )}
          </div>
        )}

        <div className="py-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-foreground">
              {t("study_round_length", "Aantal begrippen per ronde")}
            </span>
            <span className="text-muted-foreground">
              {settings.roundLength === "all" ? t("study_all_terms", "Alle") : settings.roundLength}
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={settings.roundLength === "all" ? 50 : settings.roundLength}
            onChange={(event) => {
              const value = Number(event.target.value);
              updateSettings({ roundLength: value >= 50 ? "all" : value });
            }}
            className="w-full accent-foreground"
          />
        </div>

        {isTest && (
          <div className="py-4 space-y-3">
            <p className="text-sm font-medium text-foreground">
              {t("study_question_types", "Vraagtypen")}
            </p>
            <div className="divide-y divide-border">
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
            </div>
            <p className="pt-2 text-sm font-medium text-foreground">
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
                  onChange={(event) =>
                    updateSettings({
                      testQuestionDistribution: {
                        ...settings.testQuestionDistribution!,
                        [key]: Number(event.target.value),
                      },
                    })
                  }
                  className="w-20 rounded-lg border border-border bg-background px-2 py-1.5"
                />
              </div>
            ))}
          </div>
        )}

        {!isTest && (
          <div className="py-4">
            <p className="mb-1 text-sm font-medium text-foreground">
              {t("study_choose_practice", "Kies hoe je wilt oefenen")}
            </p>
            <div className="divide-y divide-border">
              {LEREN_ACTIVITIES.map((activity) => (
                <Toggle
                  key={activity.id}
                  label={activity.label}
                  checked={selectedActivities.includes(activity.id)}
                  onChange={() => toggleActivity(activity.id)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="py-4">
          <p className="mb-1 text-sm font-medium text-foreground">
            {t("study_answer_direction", "Kies wat je moet antwoorden")}
          </p>
          <div className="divide-y divide-border">
            <Toggle
              label={t("study_answer_with_term", "Antwoord met term")}
              checked={settings.questionFormat === "definition-to-term"}
              onChange={(checked) => setQuestionFormat("definition-to-term", checked)}
            />
            <Toggle
              label={t("study_answer_with_definition", "Antwoord met definitie")}
              checked={settings.questionFormat === "term-to-definition"}
              onChange={(checked) => setQuestionFormat("term-to-definition", checked)}
            />
          </div>
        </div>

        <div className="py-2 divide-y divide-border">
          <Toggle
            label={t("study_starred_only", "Alleen gemarkeerde begrippen")}
            checked={settings.studyStarredOnly}
            onChange={(value) => updateSettings({ studyStarredOnly: value })}
          />
          <Toggle
            label={t("study_shuffle", "Begrippen shufflen")}
            checked={settings.shuffleTerms}
            onChange={(value) => updateSettings({ shuffleTerms: value })}
          />
          <Toggle
            label={t("study_smart_grading", "Slimme beoordeling (typfouten tolereren)")}
            checked={settings.smartGrading}
            onChange={(value) => updateSettings({ smartGrading: value })}
          />
          <Toggle
            label={t("study_retype", "Juiste antwoord overtypen bij fout")}
            checked={settings.retypeAnswers}
            onChange={(value) => updateSettings({ retypeAnswers: value })}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleStart}
        className="w-full rounded-xl bg-foreground py-3.5 text-base font-medium text-background transition-opacity hover:opacity-90"
      >
        {t("study_start_session", "Starten")}
      </button>
    </div>
  );
}
