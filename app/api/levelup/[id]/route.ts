import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { XP_LEVEL_UP_BONUS } from "@/lib/xp";
import type { CEFRLevel } from "@/lib/levels";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const test = await prisma.levelUpTest.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!test) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const questions = JSON.parse(test.questions) as Array<{
    type: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;

  return NextResponse.json({
    id: test.id,
    fromLevel: test.fromLevel,
    toLevel: test.toLevel,
    questions: questions.map((q, i) => ({
      id: `q${i}`,
      type: q.type,
      questionText: q.questionText,
      options: q.options,
    })),
    passed: test.passed,
    takenAt: test.takenAt,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { answers } = await request.json();

  const test = await prisma.levelUpTest.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!test) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (test.passed !== null) {
    return NextResponse.json({ error: "Test already submitted" }, { status: 400 });
  }

  const questions = JSON.parse(test.questions) as Array<{
    type: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;

  const correct = questions.filter((q, i) => answers[`q${i}`] === q.correctAnswer).length;
  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= 70;

  await prisma.levelUpTest.update({
    where: { id },
    data: { score, passed, takenAt: new Date() },
  });

  if (passed) {
    // Advance level and award XP bonus
    const language = test.language ?? "de";
    await prisma.userProgress.updateMany({
      where: { userId: session.user.id, language },
      data: {
        currentLevel: test.toLevel as CEFRLevel,
        xp: { increment: XP_LEVEL_UP_BONUS },
      },
    });
  }

  const explanations: Record<
    string,
    { correct: boolean; explanation: string; correctAnswer: string }
  > = {};
  questions.forEach((q, i) => {
    explanations[`q${i}`] = {
      correct: answers[`q${i}`] === q.correctAnswer,
      explanation: q.explanation,
      correctAnswer: q.correctAnswer,
    };
  });

  return NextResponse.json({
    score,
    passed,
    correct,
    total: questions.length,
    explanations,
    newLevel: passed ? test.toLevel : test.fromLevel,
    xpBonus: passed ? XP_LEVEL_UP_BONUS : 0,
  });
}
