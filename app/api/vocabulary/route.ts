import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { translateWord } from "@/lib/anthropic";
import { XP_VOCAB_SAVE } from "@/lib/xp";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = 20;

  const [words, total] = await Promise.all([
    prisma.vocabularyWord.findMany({
      where: { userId: session.user.id },
      orderBy: { savedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.vocabularyWord.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({
    words: words.map((w) => ({
      id: w.id,
      germanWord: w.germanWord,
      translation: w.translation,
      explanation: w.explanation,
      partOfSpeech: w.partOfSpeech,
      savedAt: w.savedAt.toISOString(),
      reviewCount: w.reviewCount,
    })),
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { germanWord, passageId, passageContext, translation, partOfSpeech } =
    await request.json();

  if (!germanWord || !passageId) {
    return NextResponse.json({ error: "germanWord and passageId required" }, { status: 400 });
  }

  // Check if word already saved for this user
  const existing = await prisma.vocabularyWord.findFirst({
    where: { userId: session.user.id, germanWord },
  });
  if (existing) {
    return NextResponse.json(existing);
  }

  // If translation not provided, use AI to translate
  let wordTranslation = translation;
  let wordExplanation = "";
  let wordPartOfSpeech = partOfSpeech ?? "unknown";

  if (!wordTranslation) {
    const aiTranslation = await translateWord(germanWord, passageContext ?? "");
    wordTranslation = aiTranslation.translation;
    wordExplanation = aiTranslation.explanation;
    wordPartOfSpeech = aiTranslation.partOfSpeech;
  }

  const word = await prisma.vocabularyWord.create({
    data: {
      userId: session.user.id,
      passageId,
      germanWord,
      translation: wordTranslation,
      explanation: wordExplanation,
      partOfSpeech: wordPartOfSpeech,
    },
  });

  // Award XP for saving a word
  await prisma.userProgress.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      currentLevel: "A1",
      xp: XP_VOCAB_SAVE,
      totalPassages: 0,
    },
    update: { xp: { increment: XP_VOCAB_SAVE } },
  });

  return NextResponse.json({
    id: word.id,
    germanWord: word.germanWord,
    translation: word.translation,
    explanation: word.explanation,
    partOfSpeech: word.partOfSpeech,
    savedAt: word.savedAt.toISOString(),
    reviewCount: word.reviewCount,
  });
}
