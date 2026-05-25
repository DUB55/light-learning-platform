import type { StudySet, Term } from "@/types/learning-platform";

interface SourceQuestion {
  id: string;
  number?: string;
  question: string;
  answer: string;
}

interface SourceParagraph {
  questions?: SourceQuestion[];
}

interface TextbookBlock {
  type?: string;
  questions?: Array<{ id: string; number?: string; text?: string; question?: string }>;
}

interface TextbookAnswer {
  questionId: string;
  answer: string;
}

interface SourceSection {
  id: string;
  title: string;
  paragraphs?: SourceParagraph[];
  blocks?: TextbookBlock[];
  answers?: TextbookAnswer[];
}

export function buildStudySetFromSections(
  sections: SourceSection[],
  pageId: string
): StudySet | null {
  const terms: Term[] = [];
  const now = new Date();

  sections.forEach((section) => {
    (section.paragraphs || []).forEach((paragraph) => {
      (paragraph.questions || []).forEach((q) => {
        if (!q.question?.trim() || !q.answer?.trim()) return;
        terms.push({
          id: q.id || `term-${terms.length}`,
          term: q.question.trim(),
          definition: q.answer.trim(),
          isStarred: false,
          masteryStatus: "unstudied",
          consecutiveCorrectCount: 0,
          createdAt: now,
        });
      });
    });

    const answerMap = new Map(
      (section.answers || []).map((a) => [a.questionId, a.answer])
    );
    (section.blocks || [])
      .filter((b) => b.type === "questions")
      .forEach((block) => {
        (block.questions || []).forEach((q) => {
          const prompt = (q.question || q.text || "").trim();
          const answer = (answerMap.get(q.id) || "").trim();
          if (!prompt || !answer) return;
          terms.push({
            id: q.id || `term-${terms.length}`,
            term: prompt,
            definition: answer,
            isStarred: false,
            masteryStatus: "unstudied",
            consecutiveCorrectCount: 0,
            createdAt: now,
          });
        });
      });
  });

  if (terms.length === 0) return null;

  return {
    id: `set-${pageId}`,
    title: sections.length === 1 ? sections[0].title : "Studie set",
    description: `${terms.length} begrippen`,
    terms,
    createdAt: now,
    updatedAt: now,
  };
}
