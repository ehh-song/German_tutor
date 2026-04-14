import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLevelUpAvailable, nextLevel, LEVEL_CONFIG, type CEFRLevel } from "@/lib/levels";
import { redirect } from "next/navigation";
import LevelUpStart from "@/components/levelup/LevelUpStart";

export default async function LevelUpPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const progress = await prisma.userProgress.findUnique({
    where: { userId: session.user.id },
  });

  if (!progress) redirect("/dashboard");

  const level = progress.currentLevel as CEFRLevel;
  const available = isLevelUpAvailable(level, progress.xp, progress.totalPassages);

  if (!available) redirect("/dashboard");

  const toLevel = nextLevel(level);
  if (!toLevel) redirect("/dashboard");

  // Check for existing pending test
  const pendingTest = await prisma.levelUpTest.findFirst({
    where: {
      userId: session.user.id,
      fromLevel: level,
      passed: null,
      takenAt: null,
    },
  });

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Level-Up Test Available!
        </h2>
        <p className="text-gray-500 mb-8">
          You&apos;re ready to advance from{" "}
          <span className={`font-bold px-2 py-0.5 rounded-full text-white ${LEVEL_CONFIG[level].color}`}>
            {level}
          </span>{" "}
          to{" "}
          <span className={`font-bold px-2 py-0.5 rounded-full text-white ${LEVEL_CONFIG[toLevel].color}`}>
            {toLevel}
          </span>
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 text-left space-y-3">
          <h3 className="font-semibold text-gray-800">Test Rules:</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>✅ 10 questions testing {toLevel}-level German</li>
            <li>✅ Mix of vocabulary, grammar, and comprehension</li>
            <li>✅ Need to score 70% or higher to advance</li>
            <li>✅ +200 XP bonus for passing</li>
            <li>❌ Failing won&apos;t deduct XP — you can retry after 5 more passages</li>
          </ul>
        </div>

        <LevelUpStart existingTestId={pendingTest?.id ?? null} />
      </div>
    </div>
  );
}
