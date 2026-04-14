import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const passages = await prisma.passage.findMany({
    where: { userId: session.user.id, status: "active" },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      level: true,
      topic: true,
      grammarFocus: true,
      createdAt: true,
      _count: { select: { attempts: true } },
    },
  });

  return NextResponse.json(passages);
}
