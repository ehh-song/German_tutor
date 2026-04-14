import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLevelUpAvailable, type CEFRLevel } from "@/lib/levels";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progress = await prisma.userProgress.findUnique({
    where: { userId: session.user.id },
  });

  if (!progress) {
    return NextResponse.json({ available: false });
  }

  const available = isLevelUpAvailable(
    progress.currentLevel as CEFRLevel,
    progress.xp,
    progress.totalPassages
  );

  // Check if there's already an active (not yet taken) test
  const pendingTest = await prisma.levelUpTest.findFirst({
    where: {
      userId: session.user.id,
      fromLevel: progress.currentLevel,
      passed: null,
      takenAt: null,
    },
  });

  return NextResponse.json({
    available,
    pendingTestId: pendingTest?.id ?? null,
    currentLevel: progress.currentLevel,
  });
}
