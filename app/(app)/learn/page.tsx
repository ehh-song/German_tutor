"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePassageStream } from "@/hooks/usePassageStream";
import { isValidLanguage, SUPPORTED_LANGUAGES } from "@/lib/languages";
import PassageReader from "@/components/passage/PassageReader";
import QuestionSet from "@/components/questions/QuestionSet";
import type { AttemptResult } from "@/types";

export default function LearnPage() {
  const searchParams = useSearchParams();
  const rawLang = searchParams.get("lang") ?? "de";
  const language = isValidLanguage(rawLang) ? rawLang : "de";
  const langInfo = SUPPORTED_LANGUAGES[language];

  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(null);
  const { streaming, text, passageId, topic: generatedTopic, grammarFocus, wordList, questions, error, done, generate, reset } =
    usePassageStream();

  function handleGenerate() {
    setAttemptResult(null);
    generate(undefined, language);
  }

  function handleComplete(result: AttemptResult) {
    setAttemptResult(result);
  }

  function handleNewPassage() {
    reset();
    setAttemptResult(null);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Learn {langInfo?.name ?? language}
      </h2>

      {!streaming && !done && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="text-5xl mb-4">{langInfo?.flag ?? "📖"}</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Generate a {langInfo?.name} passage
          </h3>
          <p className="text-gray-500 mb-6">
            A passage will be generated matching your current level and progress.
          </p>

          <button
            onClick={handleGenerate}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition text-lg"
          >
            Generate passage
          </button>

          {error && (
            <div className="mt-4 text-red-500 text-sm">{error}</div>
          )}
        </div>
      )}

      {(streaming || done) && (
        <div className="space-y-6">
          {generatedTopic && (
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-gray-800">{generatedTopic}</h3>
              {grammarFocus && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {grammarFocus}
                </span>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            {streaming && !done ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-sm text-gray-400">AI is generating your passage...</span>
              </div>
            ) : done && passageId ? (
              <>
                <PassageReader
                  text={text}
                  passageId={passageId}
                  wordList={wordList}
                />
                <p className="text-xs text-gray-400 mt-4">
                  Click on a word to see its translation. Save words to your vocabulary book.
                </p>
              </>
            ) : null}
          </div>

          {done && passageId && questions.length > 0 && !attemptResult && (
            <QuestionSet
              passageId={passageId}
              questions={questions}
              onComplete={handleComplete}
            />
          )}

          {done && !attemptResult && (
            <div className="text-center">
              <button
                onClick={handleNewPassage}
                className="text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Generate a different passage
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
