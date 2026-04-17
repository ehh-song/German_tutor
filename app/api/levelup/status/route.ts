import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLevelUpAvailable, type CEFRLevel } from "@/lib/levels";
import { isValidLanguage } from "@/lib/languages";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawLang = searchParams.get("lang") ?? "de";
  const language = isValidLanguage(rawLang) ? rawLang : "de";

  const progress = await prisma.userProgress.findFirst({
    where: { userId: session.user.id, language },
  });

  if (!progress) {
    return NextResponse.json({ available: false });
  }

  const available = isLevelUpAvailable(
    progress.currentLevel as CEFRLevel,
    progress.xp,
    progress.totalPassages
  );

  const pendingTest = await prisma.levelUpTest.findFirst({
    where: {
      userId: session.user.id,
      language,
      fromLevel: progress.currentLevel,
      passed: null,
      takenAt: null,
    },
  });

  return NextResponse.json({
    available,
    pendingTestId: pendingTest?.id ?? null,
    currentLevel: progress.currentLevel,
    language,
  });
}
