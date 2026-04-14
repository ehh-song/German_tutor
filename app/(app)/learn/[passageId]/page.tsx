import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PassageReader from "@/components/passage/PassageReader";
import PassageQuizClient from "@/components/passage/PassageQuizClient";
import type { WordItem, QuestionItem } from "@/types";

export default async function PassagePage({
  params,
}: {
  params: Promise<{ passageId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { passageId } = await params;

  const passage = await prisma.passage.findFirst({
    where: { id: passageId, userId: session.user.id },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });

  if (!passage) notFound();

  const wordList: WordItem[] = JSON.parse(passage.wordListJson);
  const questions: QuestionItem[] = passage.questions.map((q) => ({
    id: q.id,
    type: q.type,
    questionText: q.questionText,
    options: JSON.parse(q.options),
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    orderIndex: q.orderIndex,
  }));

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{passage.topic}</h2>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
          {passage.grammarFocus}
        </span>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {passage.level}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <PassageReader
          text={passage.germanText}
          passageId={passage.id}
          wordList={wordList}
        />
        <p className="text-xs text-gray-400 mt-4">
          Click any word to see its translation.
        </p>
      </div>

      <PassageQuizClient passageId={passage.id} questions={questions} />
    </div>
  );
}
