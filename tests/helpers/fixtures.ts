import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { LEVEL_CONFIG, type CEFRLevel } from '@/lib/levels'

export async function createTestUser(
  email = 'learner@test.com',
  password = 'password123',
) {
  const passwordHash = await bcrypt.hash(password, 1) // cost=1 for test speed
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      name: 'Test Learner',
      isActive: true,
      progress: {
        create: { language: 'de', currentLevel: 'A1', xp: 0, totalPassages: 0, streakDays: 0 },
      },
    },
    select: { id: true, email: true },
  })
}

// Seeds progress to exactly meet the level-up threshold for the given level
export async function seedProgressToThreshold(userId: string, level: CEFRLevel = 'A1', language = 'de') {
  const { xpToUnlockTest, minPassages } = LEVEL_CONFIG[level]
  if (xpToUnlockTest === null || minPassages === null) {
    throw new Error(`Level ${level} has no unlock threshold`)
  }
  await prisma.userProgress.update({
    where: { userId_language: { userId, language } },
    data: { xp: xpToUnlockTest, totalPassages: minPassages },
  })
}
