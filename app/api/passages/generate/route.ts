import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { streamPassageGeneration } from "@/lib/anthropic";
import type { CEFRLevel } from "@/lib/levels";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { topic } = await request.json().catch(() => ({}));

  const progress = await prisma.userProgress.findUnique({
    where: { userId: session.user.id },
  });

  const level = (progress?.currentLevel ?? "A1") as CEFRLevel;

  const userId = session.user.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of streamPassageGeneration(level, topic)) {
          if (event.type === "chunk") {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "chunk", text: event.text })}\n\n`)
            );
          } else if (event.type === "done") {
            // Persist to DB
            const passage = await prisma.passage.create({
              data: {
                userId,
                level,
                germanText: event.data.germanText,
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
