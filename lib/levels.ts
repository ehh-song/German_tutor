export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const LEVEL_CONFIG: Record<
  CEFRLevel,
  { xpToUnlockTest: number | null; minPassages: number | null; label: string; color: string }
> = {
  A1: { xpToUnlockTest: 200, minPassages: 5, label: "Beginner", color: "bg-green-500" },
  A2: { xpToUnlockTest: 500, minPassages: 12, label: "Elementary", color: "bg-lime-500" },
  B1: { xpToUnlockTest: 1000, minPassages: 25, label: "Intermediate", color: "bg-yellow-500" },
  B2: { xpToUnlockTest: 2000, minPassages: 50, label: "Upper-Intermediate", color: "bg-orange-500" },
  C1: { xpToUnlockTest: 3500, minPassages: 80, label: "Advanced", color: "bg-red-500" },
  C2: { xpToUnlockTest: null, minPassages: null, label: "Mastery", color: "bg-purple-500" },
};

export function nextLevel(level: CEFRLevel): CEFRLevel | null {
  const idx = LEVELS.indexOf(level);
  if (idx === -1 || idx === LEVELS.length - 1) return null;
  return LEVELS[idx + 1];
}

export function isLevelUpAvailable(
  level: CEFRLevel,
  xp: number,
  totalPassages: number
): boolean {
  const config = LEVEL_CONFIG[level];
  if (config.xpToUnlockTest === null || config.minPassages === null) return false;
  return xp >= config.xpToUnlockTest && totalPassages >= config.minPassages;
}
