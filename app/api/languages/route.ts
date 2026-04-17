import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progressRecords = await prisma.userProgress.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  const languages = progressRecords.map((p) => {
    const info = SUPPORTED_LANGUAGES[p.language as keyof typeof SUPPORTED_LANGUAGES];
    return {
      language: p.language,
      name: info?.name ?? p.language,
      nativeName: info?.nativeName ?? p.language,
      flag: info?.flag ?? "🌐",
      currentLevel: p.currentLevel,
      xp: p.xp,
      totalPassages: p.totalPassages,
    };
  });

  return NextResponse.json({ languages });
}
