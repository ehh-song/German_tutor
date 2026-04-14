export const XP_LEVEL_UP_BONUS = 200;
export const XP_VOCAB_SAVE = 2;

export function calculatePassageXP(score: number): number {
  if (score === 100) return 50;
  if (score >= 80) return 35;
  if (score >= 60) return 20;
  return 10;
}

export function calculateScore(
  answers: Record<string, string>,
  questions: Array<{ id: string; correctAnswer: string }>
): number {
  if (questions.length === 0) return 0;
  const correct = questions.filter((q) => answers[q.id] === q.correctAnswer).length;
  return Math.round((correct / questions.length) * 100);
}
