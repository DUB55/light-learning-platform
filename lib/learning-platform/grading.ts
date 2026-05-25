const PUNCTUATION_REGEX = /[.,!?;:'"()[\]{}«»""''–—\-_/\\]/g;

export function normalizeForGrading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(PUNCTUATION_REGEX, "")
    .replace(/\s+/g, " ");
}

export function levenshteinDistance(a: string, b: string): number {
  const left = normalizeForGrading(a);
  const right = normalizeForGrading(b);
  if (left === right) return 0;
  const matrix: number[][] = Array.from({ length: left.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= right.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      matrix[i][j] =
        left[i - 1] === right[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[left.length][right.length];
}

export interface GradingResult {
  isCorrect: boolean;
  isTypo: boolean;
  distance: number;
}

const SMART_GRADING_MAX_DISTANCE = 2;

export function evaluateAnswer(
  userInput: string,
  correctAnswer: string,
  useSmartGrading: boolean
): GradingResult {
  const normalizedUser = normalizeForGrading(userInput);
  const normalizedCorrect = normalizeForGrading(correctAnswer);

  if (!normalizedUser) {
    return { isCorrect: false, isTypo: false, distance: Infinity };
  }

  if (normalizedUser === normalizedCorrect) {
    return { isCorrect: true, isTypo: false, distance: 0 };
  }

  const distance = levenshteinDistance(userInput, correctAnswer);

  if (useSmartGrading && distance <= SMART_GRADING_MAX_DISTANCE) {
    return { isCorrect: true, isTypo: true, distance };
  }

  return { isCorrect: false, isTypo: false, distance };
}
