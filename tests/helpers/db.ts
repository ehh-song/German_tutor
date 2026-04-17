import { prisma } from '@/lib/prisma'

export async function clearTestDb() {
  await prisma.user.deleteMany() // cascades to all child tables
}
