import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidLanguage, SUPPORTED_LANGUAGES } from "@/lib/languages";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { language } = await request.json();

  if (!language || !isValidLanguage(language)) {
    return NextResponse.json({ error: "Invalid language code" }, { status: 400 });
  }

  const existing = await prisma.userProgress.findFirst({
    where: { userId: session.user.id, language },
  });

  if (existing) {
    return NextResponse.json({ error: "Language already started" }, { status: 409 });
  }

  const [progress] = await prisma.$transaction([
    prisma.userProgress.create({
      data: {
        userId: session.user.id,
        language,
        currentLevel: "A1",
        xp: 0,
        totalPassages: 0,
        streakDays: 0,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { selectedLanguage: language },
    }),
  ]);

  const info = SUPPORTED_LANGUAGES[language];
  return NextResponse.json({
    language: progress.language,
    name: info.name,
    nativeName: info.nativeName,
    flag: info.flag,
    currentLevel: progress.currentLevel,
    xp: progress.xp,
    totalPassages: progress.totalPassages,
  });
}
