import type { StudySettings } from "@/types/learning-platform";

export const defaultStudySettings: StudySettings = {
  roundLength: 20,
  enabledQuestionTypes: ["multiple-choice", "written", "true-false"],
  questionFormat: "term-to-definition",
  studyStarredOnly: false,
  shuffleTerms: true,
  smartGrading: true,
  retypeAnswers: false,
  testQuestionDistribution: {
    "true-false": 25,
    "multiple-choice": 50,
    written: 25,
  },
  lerenActivity: "learn",
};
