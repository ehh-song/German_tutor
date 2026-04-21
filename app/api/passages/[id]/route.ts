import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const passage = await prisma.passage.findFirst({
    where: { id, userId: session.user.id },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!passage) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: passage.id,
    level: passage.level,
    text: passage.text,
    topic: passage.topic,
    grammarFocus: passage.grammarFocus,
    wordList: JSON.parse(passage.wordListJson),
    questions: passage.questions.map((q) => ({
      id: q.id,
      type: q.type,
      questionText: q.questionText,
      options: JSON.parse(q.options),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      orderIndex: q.orderIndex,
    })),
    createdAt: passage.createdAt.toISOString(),
  });
}
