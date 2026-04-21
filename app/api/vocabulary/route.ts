import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { translateWord } from "@/lib/ai";
import { XP_VOCAB_SAVE } from "@/lib/xp";
import { isValidLanguage } from "@/lib/languages";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const rawLang = searchParams.get("lang") ?? "de";
  const language = isValidLanguage(rawLang) ? rawLang : "de";
  const pageSize = 20;

  const [words, total] = await Promise.all([
    prisma.vocabularyWord.findMany({
      where: { userId: session.user.id, language },
      orderBy: { savedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.vocabularyWord.count({ where: { userId: session.user.id, language } }),
  ]);

  return NextResponse.json({
    words: words.map((w) => ({
      id: w.id,
      word: w.word,
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

  const { word: wordParam, passageId, passageContext, translation, partOfSpeech, language: rawLang } =
    await request.json();

  if (!wordParam || !passageId) {
    return NextResponse.json({ error: "word and passageId required" }, { status: 400 });
  }

  // Derive language from the passage itself (most reliable)
  const passage = await prisma.passage.findFirst({
    where: { id: passageId, userId: session.user.id },
    select: { language: true },
  });
  const rawLanguage = passage?.language ?? rawLang;
  const language = isValidLanguage(rawLanguage) ? rawLanguage : ("de" as const);

  // Check if word already saved for this user + language
  const existing = await prisma.vocabularyWord.findFirst({
    where: { userId: session.user.id, language, word: wordParam },
  });
  if (existing) {
    return NextResponse.json({
      id: existing.id,
      word: existing.word,
      translation: existing.translation,
      explanation: existing.explanation,
      partOfSpeech: existing.partOfSpeech,
      savedAt: existing.savedAt.toISOString(),
      reviewCount: existing.reviewCount,
    });
  }

  // If translation not provided, use AI to translate
  let wordTranslation = translation;
  let wordExplanation = "";
  let wordPartOfSpeech = partOfSpeech ?? "unknown";

  if (!wordTranslation) {
    const aiTranslation = await translateWord(wordParam, passageContext ?? "", language);
    wordTranslation = aiTranslation.translation;
    wordExplanation = aiTranslation.explanation;
    wordPartOfSpeech = aiTranslation.partOfSpeech;
  }

  const savedWord = await prisma.vocabularyWord.create({
    data: {
      userId: session.user.id,
      language,
      passageId,
      word: wordParam,
      translation: wordTranslation,
      explanation: wordExplanation,
      partOfSpeech: wordPartOfSpeech,
    },
  });

  // Award XP for saving a word
  await prisma.userProgress.upsert({
    where: { userId_language: { userId: session.user.id, language } },
    create: {
      userId: session.user.id,
      language,
      currentLevel: "A1",
      xp: XP_VOCAB_SAVE,
      totalPassages: 0,
    },
    update: { xp: { increment: XP_VOCAB_SAVE } },
  });

  return NextResponse.json({
    id: savedWord.id,
    word: savedWord.word,
    translation: savedWord.translation,
    explanation: savedWord.explanation,
    partOfSpeech: savedWord.partOfSpeech,
    savedAt: savedWord.savedAt.toISOString(),
    reviewCount: savedWord.reviewCount,
  });
}
