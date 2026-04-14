import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LevelUpTestClient from "@/components/levelup/LevelUpTestClient";
import type { QuestionItem } from "@/types";
import { LEVEL_CONFIG } from "@/lib/levels";
import type { CEFRLevel } from "@/lib/levels";

export default async function LevelUpTestPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { testId } = await params;

  const test = await prisma.levelUpTest.findFirst({
    where: { id: testId, userId: session.user.id },
  });

  if (!test) notFound();

  const rawQuestions = JSON.parse(test.questions) as Array<{
    type: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;

  const questions: QuestionItem[] = rawQuestions.map((q, i) => ({
    id: `q${i}`,
    type: q.type,
    questionText: q.questionText,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    orderIndex: i,
  }));

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-2xl font-bold text-gray-800">Level-Up Test</h2>
          <span className={`px-2 py-0.5 rounded-full text-white text-sm font-bold ${LEVEL_CONFIG[test.fromLevel as CEFRLevel]?.color ?? "bg-gray-400"}`}>
            {test.fromLevel}
          </span>
          <span className="text-gray-400">→</span>
          <span className={`px-2 py-0.5 rounded-full text-white text-sm font-bold ${LEVEL_CONFIG[test.toLevel as CEFRLevel]?.color ?? "bg-gray-400"}`}>
            {test.toLevel}
          </span>
        </div>
        <p className="text-gray-500 text-sm">10 questions · Need 70% to advance</p>
      </div>

      {test.passed !== null ? (
        <div className={`rounded-2xl p-8 text-center ${test.passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <div className="text-5xl mb-3">{test.passed ? "🎉" : "😔"}</div>
          <div className={`text-2xl font-bold mb-2 ${test.passed ? "text-green-700" : "text-red-600"}`}>
            {test.passed ? "Congratulations!" : "Not quite there yet"}
          </div>
          <div className="text-gray-600 mb-1">Score: {test.score}%</div>
          {test.passed ? (
            <div className="text-green-600 font-medium">
              You&apos;ve advanced to {test.toLevel}! +200 XP bonus earned.
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              Keep practising at {test.fromLevel} and try again after 5 more passages.
            </div>
          )}
        </div>
      ) : (
        <LevelUpTestClient testId={test.id} questions={questions} />
      )}
    </div>
  );
}
