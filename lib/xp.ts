export const XP_LEVEL_UP_BONUS = 200;
export const XP_VOCAB_SAVE = 2;
export const XP_PER_CORRECT = 2;
export const XP_PERFECT_BONUS = 5;

/** 문제당 2XP, 전부 맞추면 +5XP 보너스 */
export function calculatePassageXP(correctAnswers: number, totalQuestions: number): number {
  const base = correctAnswers * XP_PER_CORRECT;
  const bonus = correctAnswers === totalQuestions ? XP_PERFECT_BONUS : 0;
  return base + bonus;
}

export function calculateScore(
  answers: Record<string, string>,
  questions: Array<{ id: string; correctAnswer: string }>
): number {
  if (questions.length === 0) return 0;
  const correct = questions.filter((q) => answers[q.id] === q.correctAnswer).length;
  return Math.round((correct / questions.length) * 100);
}
