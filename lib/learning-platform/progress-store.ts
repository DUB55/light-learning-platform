import type {
  LearningMode,
  MasteryStatus,
  StudySession,
  StudySettings,
  Term,
  UserTermProgress,
} from "@/types/learning-platform";

const PROGRESS_KEY = "learning-platform-progress-v1";
const SESSIONS_KEY = "learning-platform-sessions-v1";
const SETTINGS_KEY = "learning-platform-settings-v1";

const DEFAULT_USER_ID = "local-user";

export function computeMasteryStatus(progress?: UserTermProgress): MasteryStatus {
  if (!progress || progress.totalAttempts === 0) return "unstudied";
  if (progress.consecutiveCorrectCount >= 2 && progress.status === "mastered") return "mastered";
  if (progress.consecutiveCorrectCount >= 2) return "mastered";
  return "learning";
}

export function applyTermProgress(
  progress: UserTermProgress | undefined,
  termId: string,
  isCorrect: boolean,
  wasWritten = false
): UserTermProgress {
  const now = new Date();
  const base: UserTermProgress = progress ?? {
    userId: DEFAULT_USER_ID,
    termId,
    status: "unstudied",
    consecutiveCorrectCount: 0,
    isStarred: false,
    totalAttempts: 0,
    correctAttempts: 0,
    createdAt: now,
    updatedAt: now,
  };

  const consecutiveCorrectCount = isCorrect
    ? base.consecutiveCorrectCount + 1
    : 0;

  let status: MasteryStatus = "learning";
  if (base.totalAttempts + 1 === 0) status = "unstudied";
  else if (wasWritten && consecutiveCorrectCount >= 2) status = "mastered";
  else if (!isCorrect) status = "learning";
  else if (consecutiveCorrectCount >= 2) status = "mastered";
  else status = "learning";

  if (base.totalAttempts === 0 && !isCorrect) status = "learning";
  if (base.totalAttempts === 0 && isCorrect) status = "learning";

  return {
    ...base,
    status,
    consecutiveCorrectCount,
    totalAttempts: base.totalAttempts + 1,
    correctAttempts: base.correctAttempts + (isCorrect ? 1 : 0),
    lastAttemptDate: now,
    updatedAt: now,
  };
}

export function mergeTermsWithProgress(
  terms: Term[],
  progressMap: Record<string, UserTermProgress>
): Term[] {
  return terms.map((term) => {
    const p = progressMap[term.id];
    if (!p) return term;
    return {
      ...term,
      masteryStatus: computeMasteryStatus(p),
      consecutiveCorrectCount: p.consecutiveCorrectCount,
      isStarred: p.isStarred,
      lastStudied: p.lastAttemptDate,
    };
  });
}

export interface ProgressStore {
  progress: Record<string, UserTermProgress>;
  sessions: StudySession[];
}

export function loadProgressStore(studySetId: string): ProgressStore {
  if (typeof window === "undefined") {
    return { progress: {}, sessions: [] };
  }
  try {
    const allProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}") as Record<
      string,
      Record<string, UserTermProgress>
    >;
    const allSessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || "{}") as Record<
      string,
      StudySession[]
    >;
    const progress = allProgress[studySetId] || {};
    const sessions = (allSessions[studySetId] || []).map((s) => ({
      ...s,
      startTime: new Date(s.startTime),
      endTime: s.endTime ? new Date(s.endTime) : undefined,
    }));
    return { progress, sessions };
  } catch {
    return { progress: {}, sessions: [] };
  }
}

export function saveProgressForSet(studySetId: string, progress: Record<string, UserTermProgress>) {
  if (typeof window === "undefined") return;
  const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  all[studySetId] = progress;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
}

export function saveSession(studySetId: string, session: StudySession) {
  if (typeof window === "undefined") return;
  const all = JSON.parse(localStorage.getItem(SESSIONS_KEY) || "{}");
  const list: StudySession[] = all[studySetId] || [];
  list.push(session);
  all[studySetId] = list.slice(-50);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(all));
}

export function resetProgressForSet(studySetId: string) {
  if (typeof window === "undefined") return;
  const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  delete all[studySetId];
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
}

export function loadSettings(studySetId: string): StudySettings | null {
  if (typeof window === "undefined") return null;
  try {
    const all = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    const raw = all[studySetId];
    if (!raw) return null;
    return {
      ...raw,
      examDate: raw.examDate ? new Date(raw.examDate) : undefined,
    };
  } catch {
    return null;
  }
}

export function saveSettings(studySetId: string, settings: StudySettings) {
  if (typeof window === "undefined") return;
  const all = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
  all[studySetId] = settings;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(all));
}

export function startSession(
  studySetId: string,
  mode: LearningMode,
  settings: StudySettings,
  totalQuestions: number
): StudySession {
  return {
    id: `session-${Date.now()}`,
    userId: DEFAULT_USER_ID,
    studySetId,
    mode,
    startTime: new Date(),
    totalQuestions,
    correctAnswers: 0,
    settings,
    termResults: [],
  };
}
