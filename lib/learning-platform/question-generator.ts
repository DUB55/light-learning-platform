import type { Question, QuestionType, StudySettings, Term } from "@/types/learning-platform";
import { fisherYatesShuffle } from "./term-filters";
import { getPromptAndAnswer } from "./term-filters";

export function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function pickDistractors(
  allTerms: Term[],
  current: Term,
  count: number,
  pickFrom: "term" | "definition"
): string[] {
  const field = pickFrom === "term" ? "term" : "definition";
  const pool = allTerms
    .filter((t) => t.id !== current.id && t[field].trim())
    .map((t) => t[field]);
  const unique = Array.from(new Set(pool));
  const shuffled = fisherYatesShuffle(unique);
  const distractors: string[] = [];
  for (const item of shuffled) {
    if (distractors.length >= count) break;
    if (item !== current[field]) distractors.push(item);
  }
  while (distractors.length < count) {
    distractors.push(`— ${distractors.length + 1}`);
  }
  return distractors.slice(0, count);
}

export function buildMcqQuestion(
  term: Term,
  allTerms: Term[],
  settings: StudySettings
): Question {
  const { prompt, answer } = getPromptAndAnswer(term, settings.questionFormat);
  const distractors = pickDistractors(allTerms, term, 3, settings.questionFormat === "term-to-definition" ? "definition" : "term");
  const options = fisherYatesShuffle([answer, ...distractors]);
  return {
    id: createId("q"),
    term,
    type: "multiple-choice",
    prompt,
    correctAnswer: answer,
    options,
    startTime: new Date(),
  };
}

export function buildWrittenQuestion(term: Term, settings: StudySettings): Question {
  const { prompt, answer } = getPromptAndAnswer(term, settings.questionFormat);
  return {
    id: createId("q"),
    term,
    type: "written",
    prompt,
    correctAnswer: answer,
    startTime: new Date(),
  };
}

export function buildTrueFalseQuestion(
  term: Term,
  allTerms: Term[],
  settings: StudySettings,
  forceFalse = false
): Question {
  const { prompt, answer } = getPromptAndAnswer(term, settings.questionFormat);
  const isTrue = forceFalse ? false : Math.random() < 0.5;
  const displayedAnswer = isTrue
    ? answer
    : pickDistractors(allTerms, term, 1, settings.questionFormat === "term-to-definition" ? "definition" : "term")[0];
  const statement = settings.questionFormat === "term-to-definition"
    ? `${prompt} — ${displayedAnswer}`
    : `${prompt} betekent: ${displayedAnswer}`;

  return {
    id: createId("q"),
    term,
    type: "true-false",
    prompt: statement,
    correctAnswer: isTrue ? "True" : "False",
    options: ["True", "False"],
    startTime: new Date(),
  };
}

export function buildTestQuestions(terms: Term[], allTerms: Term[], settings: StudySettings): Question[] {
  const dist = settings.testQuestionDistribution ?? {
    "true-false": 25,
    "multiple-choice": 50,
    written: 25,
  };
  const total = terms.length;
  const tfCount = Math.round((total * dist["true-false"]) / 100);
  const mcqCount = Math.round((total * dist["multiple-choice"]) / 100);
  const writtenCount = Math.max(0, total - tfCount - mcqCount);

  const shuffled = fisherYatesShuffle(terms);
  const questions: Question[] = [];
  let idx = 0;

  const enabled = new Set(settings.enabledQuestionTypes);

  for (let i = 0; i < tfCount && idx < shuffled.length; i++, idx++) {
    if (enabled.has("true-false")) {
      questions.push(buildTrueFalseQuestion(shuffled[idx], allTerms, settings, i % 2 === 1));
    }
  }
  for (let i = 0; i < mcqCount && idx < shuffled.length; i++, idx++) {
    if (enabled.has("multiple-choice")) {
      questions.push(buildMcqQuestion(shuffled[idx], allTerms, settings));
    }
  }
  for (let i = 0; i < writtenCount && idx < shuffled.length; i++, idx++) {
    if (enabled.has("written")) {
      questions.push(buildWrittenQuestion(shuffled[idx], settings));
    }
  }

  while (idx < shuffled.length) {
    const t = shuffled[idx++];
    if (enabled.has("multiple-choice")) questions.push(buildMcqQuestion(t, allTerms, settings));
    else if (enabled.has("written")) questions.push(buildWrittenQuestion(t, settings));
    else if (enabled.has("true-false")) questions.push(buildTrueFalseQuestion(t, allTerms, settings));
  }

  return fisherYatesShuffle(questions);
}

export function learnQuestionTypeForTerm(
  term: Term,
  consecutiveCorrect: number
): QuestionType {
  if (consecutiveCorrect >= 2) return "written";
  return "multiple-choice";
}

export function buildLearnQuestion(
  term: Term,
  allTerms: Term[],
  settings: StudySettings,
  consecutiveCorrect: number
): Question {
  const type = learnQuestionTypeForTerm(term, consecutiveCorrect);
  if (type === "written") return buildWrittenQuestion(term, settings);
  return buildMcqQuestion(term, allTerms, settings);
}
