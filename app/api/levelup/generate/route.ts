import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateLevelUpTest } from "@/lib/ai";
import { isLevelUpAvailable, nextLevel, type CEFRLevel } from "@/lib/levels";
import { isValidLanguage } from "@/lib/languages";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rawLang = (body as { language?: string }).language ?? "de";
  const language = isValidLanguage(rawLang) ? rawLang : "de";

  const progress = await prisma.userProgress.findFirst({
    where: { userId: session.user.id, language },
  });

  if (!progress) {
    return NextResponse.json({ error: "No progress found" }, { status: 404 });
  }

  const fromLevel = progress.currentLevel as CEFRLevel;
  const toLevel = nextLevel(fromLevel);

  if (!toLevel) {
    return NextResponse.json({ error: "Already at max level" }, { status: 400 });
  }

  if (!isLevelUpAvailable(fromLevel, progress.xp, progress.totalPassages)) {
    return NextResponse.json({ error: "Level-up not yet available" }, { status: 403 });
  }

  const testData = await generateLevelUpTest(fromLevel, toLevel, language);

  const test = await prisma.levelUpTest.create({
    data: {
      userId: session.user.id,
      language,
      fromLevel,
      toLevel,
      questions: JSON.stringify(testData.questions),
    },
  });

  return NextResponse.json({
    id: test.id,
    fromLevel: test.fromLevel,
    toLevel: test.toLevel,
    language: test.language,
    questions: testData.questions.map((q, i) => ({
      id: `q${i}`,
      type: q.type,
      questionText: q.questionText,
      options: q.options,
    })),
  });
}
