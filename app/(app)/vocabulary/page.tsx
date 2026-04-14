import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VocabBook from "@/components/vocabulary/VocabBook";

export default async function VocabularyPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const total = await prisma.vocabularyWord.count({
    where: { userId: session.user.id },
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Vocabulary Book</h2>
          <p className="text-gray-400 text-sm mt-0.5">{total} words saved</p>
        </div>
      </div>

      <VocabBook />
    </div>
  );
}
