import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      approvedAt: true,
      lastLoginAt: true,
      createdAt: true,
      _count: {
        select: {
          passages: true,
          attempts: true,
          vocabularyWords: true,
        },
      },
      progress: {
        select: {
          language: true,
          currentLevel: true,
          xp: true,
          totalPassages: true,
        },
      },
    },
  });

  return NextResponse.json(users);
}
