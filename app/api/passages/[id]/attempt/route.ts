import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateScore, calculatePassageXP } from "@/lib/xp";
import { isLevelUpAvailable, type CEFRLevel } from "@/lib/levels";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: passageId } = await params;
  const { answers } = await request.json();

  const passage = await prisma.passage.findFirst({
    where: { id: passageId, userId: session.user.id },
    include: { questions: true },
  });

  if (!passage) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const language = passage.language ?? "de";

  const score = calculateScore(
    answers,
    passage.questions.map((q) => ({ id: q.id, correctAnswer: q.correctAnswer }))
  );

  const correctAnswers = passage.questions.filter(
    (q) => answers[q.id] === q.correctAnswer
  ).length;

  const xpEarned = calculatePassageXP(correctAnswers, passage.questions.length);

  await prisma.passageAttempt.create({
    data: {
      userId: session.user.id,
      passageId,
      answers: JSON.stringify(answers),
      score,
      xpEarned,
    },
  });

  const progress = await prisma.userProgress.upsert({
    where: { userId_language: { userId: session.user.id, language } },
    create: {
      userId: session.user.id,
      language,
      currentLevel: "A1",
      xp: xpEarned,
      totalPassages: 1,
      lastActivityAt: new Date(),
    },
    update: {
      xp: { increment: xpEarned },
      totalPassages: { increment: 1 },
      lastActivityAt: new Date(),
    },
  });

  const levelUpAvailable = isLevelUpAvailable(
    progress.currentLevel as CEFRLevel,
    progress.xp,
    progress.totalPassages
  );

  const explanations: Record<
    string,
    { correct: boolean; explanation: string; correctAnswer: string }
  > = {};
  for (const q of passage.questions) {
    explanations[q.id] = {
      correct: answers[q.id] === q.correctAnswer,
      explanation: q.explanation,
      correctAnswer: q.correctAnswer,
    };
  }

  return NextResponse.json({
    score,
    xpEarned,
    correctAnswers,
    totalQuestions: passage.questions.length,
    explanations,
    levelUpAvailable,
    newXP: progress.xp,
    newTotalPassages: progress.totalPassages,
    language,
  });
}
