import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { streamPassageGeneration } from "@/lib/ai";
import { LEVEL_CONFIG, type CEFRLevel } from "@/lib/levels";
import { isValidLanguage } from "@/lib/languages";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { topic } = body as { topic?: string };
  const rawLang = (body as { language?: string }).language ?? "de";
  const language = isValidLanguage(rawLang) ? rawLang : "de";

  const progress = await prisma.userProgress.findFirst({
    where: { userId: session.user.id, language },
  });

  const level = (progress?.currentLevel ?? "A1") as CEFRLevel;
  const xp = progress?.xp ?? 0;
  const xpThreshold = LEVEL_CONFIG[level].xpToUnlockTest ?? 1;
  const xpProgress = Math.min(1, xp / xpThreshold);

  const userId = session.user.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of streamPassageGeneration(level, xpProgress, language, topic)) {
          if (event.type === "chunk") {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "chunk", text: event.text })}\n\n`)
            );
          } else if (event.type === "done") {
            const passage = await prisma.passage.create({
              data: {
                userId,
                language,
                level,
                text: event.data.passageText,
                topic: event.data.topic,
                grammarFocus: event.data.grammarFocus,
                wordListJson: JSON.stringify(event.data.wordList),
                questions: {
                  create: event.data.questions.map((q, i) => ({
                    type: q.type,
                    questionText: q.questionText,
                    options: JSON.stringify(q.options),
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                    orderIndex: i,
                  })),
                },
              },
              include: { questions: true },
            });

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "done",
                  passageId: passage.id,
                  passageText: passage.text,
                  topic: passage.topic,
                  grammarFocus: passage.grammarFocus,
                  wordList: event.data.wordList,
                  questions: passage.questions.map((q) => ({
                    id: q.id,
                    type: q.type,
                    questionText: q.questionText,
                    options: JSON.parse(q.options),
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                    orderIndex: q.orderIndex,
                  })),
                })}\n\n`
              )
            );

            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", error: String(err) })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
