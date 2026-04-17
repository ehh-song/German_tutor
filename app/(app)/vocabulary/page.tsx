import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidLanguage, SUPPORTED_LANGUAGES } from "@/lib/languages";
import VocabBook from "@/components/vocabulary/VocabBook";

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { lang: rawLang } = await searchParams;
  const language = isValidLanguage(rawLang ?? "") ? (rawLang as string) : "de";
  const langInfo = SUPPORTED_LANGUAGES[language as keyof typeof SUPPORTED_LANGUAGES];

  const total = await prisma.vocabularyWord.count({
    where: { userId: session.user.id, language },
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-2xl">{langInfo?.flag}</span>
            <h2 className="text-2xl font-bold text-gray-800">Vocabulary Book</h2>
          </div>
          <p className="text-gray-400 text-sm">{total} {langInfo?.name} words saved</p>
        </div>
      </div>

      <VocabBook language={language} />
    </div>
  );
}
