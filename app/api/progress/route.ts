import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLevelUpAvailable, LEVEL_CONFIG, type CEFRLevel } from "@/lib/levels";
import { isValidLanguage } from "@/lib/languages";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawLang = searchParams.get("lang") ?? "de";
  const language = isValidLanguage(rawLang) ? rawLang : "de";

  let progress = await prisma.userProgress.findFirst({
    where: { userId: session.user.id, language },
  });

  if (!progress) {
    progress = await prisma.userProgress.create({
      data: {
        userId: session.user.id,
        language,
        currentLevel: "A1",
        xp: 0,
        totalPassages: 0,
        streakDays: 0,
      },
    });
  }

  const level = progress.currentLevel as CEFRLevel;
  const levelConfig = LEVEL_CONFIG[level];
  const levelUpAvailable = isLevelUpAvailable(level, progress.xp, progress.totalPassages);

  const xpToNextTest = levelConfig.xpToUnlockTest
    ? Math.max(0, levelConfig.xpToUnlockTest - progress.xp)
    : null;
  const passagesToNextTest = levelConfig.minPassages
    ? Math.max(0, levelConfig.minPassages - progress.totalPassages)
    : null;

  return NextResponse.json({
    currentLevel: progress.currentLevel,
    xp: progress.xp,
    totalPassages: progress.totalPassages,
    streakDays: progress.streakDays,
    levelUpAvailable,
    xpToNextTest,
    passagesToNextTest,
    language,
  });
}
