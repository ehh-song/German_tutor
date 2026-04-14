import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLevelUpAvailable, LEVEL_CONFIG, type CEFRLevel } from "@/lib/levels";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [progress, recentPassages] = await Promise.all([
    prisma.userProgress.findUnique({ where: { userId: session.user.id } }),
    prisma.passage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { attempts: true } } },
    }),
  ]);

  const level = (progress?.currentLevel ?? "A1") as CEFRLevel;
  const levelConfig = LEVEL_CONFIG[level];
  const xp = progress?.xp ?? 0;
  const totalPassages = progress?.totalPassages ?? 0;
  const xpForTest = levelConfig.xpToUnlockTest;
  const xpPercent = xpForTest ? Math.min(100, (xp / xpForTest) * 100) : 100;
  const levelUpAvailable = isLevelUpAvailable(level, xp, totalPassages);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-white text-sm font-bold ${levelConfig.color}`}>
              {level}
            </span>
            <span className="text-sm text-gray-500">{levelConfig.label}</span>
          </div>
          <div className="text-xs text-gray-400 mt-2">Current Level</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl font-bold text-indigo-600">{xp}</div>
          <div className="text-xs text-gray-400 mt-1">Total XP</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-3xl font-bold text-green-600">{totalPassages}</div>
          <div className="text-xs text-gray-400 mt-1">Passages Completed</div>
        </div>
      </div>

      {/* XP Progress */}
      {xpForTest && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress to Level-Up Test</span>
            <span className="text-sm text-gray-500">{xp} / {xpForTest} XP</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-indigo-500 h-3 rounded-full transition-all duration-700"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          {levelConfig.minPassages && (
            <div className="text-xs text-gray-400 mt-1">
              Also need {Math.max(0, levelConfig.minPassages - totalPassages)} more passages
            </div>
          )}
        </div>
      )}

      {/* Level-up banner */}
      {levelUpAvailable && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex items-center justify-between">
          <div>
            <div className="font-semibold text-amber-800">Level-Up Test Available!</div>
            <div className="text-sm text-amber-600 mt-0.5">
              You&apos;ve met the requirements to advance from {level} to the next level.
            </div>
          </div>
          <Link
            href="/levelup"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-sm transition"
          >
            Take Test
          </Link>
        </div>
      )}

      {/* CTA */}
      <div className="bg-indigo-600 rounded-xl p-6 mb-8 flex items-center justify-between text-white">
        <div>
          <div className="font-bold text-lg">Ready to learn?</div>
          <div className="text-indigo-200 text-sm mt-0.5">
            Generate a new {level}-level German passage
          </div>
        </div>
        <Link
          href="/learn"
          className="px-5 py-2.5 bg-white text-indigo-700 font-semibold rounded-lg text-sm hover:bg-indigo-50 transition"
        >
          Start Learning
        </Link>
      </div>

      {/* Recent passages */}
      {recentPassages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Recent Passages</h3>
          <div className="space-y-2">
            {recentPassages.map((p) => (
              <Link
                key={p.id}
                href={`/learn/${p.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition"
              >
                <div>
                  <span className="font-medium text-gray-800">{p.topic}</span>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {p.grammarFocus} · {new Date(p.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-white text-xs font-bold ${LEVEL_CONFIG[p.level as CEFRLevel]?.color ?? "bg-gray-400"}`}>
                    {p.level}
                  </span>
                  <span className="text-xs text-gray-400">
                    {p._count.attempts} attempt{p._count.attempts !== 1 ? "s" : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
