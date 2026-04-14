import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLevelUpAvailable, LEVEL_CONFIG, type CEFRLevel } from "@/lib/levels";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let progress = await prisma.userProgress.findUnique({
    where: { userId: session.user.id },
  });

  if (!progress) {
    progress = await prisma.userProgress.create({
      data: {
        userId: session.user.id,
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
  });
}
