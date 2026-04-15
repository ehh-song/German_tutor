"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePassageStream } from "@/hooks/usePassageStream";
import PassageReader from "@/components/passage/PassageReader";
import QuestionSet from "@/components/questions/QuestionSet";
import type { AttemptResult } from "@/types";

export default function LearnPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(null);
  const { streaming, text, passageId, topic: generatedTopic, grammarFocus, wordList, questions, error, done, generate, reset } =
    usePassageStream();

  function handleGenerate() {
    setAttemptResult(null);
    generate(topic.trim() || undefined);
  }

  function handleComplete(result: AttemptResult) {
    setAttemptResult(result);
  }

  function handleNewPassage() {
    reset();
    setAttemptResult(null);
    setTopic("");
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Learn German</h2>

      {!streaming && !done && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="text-5xl mb-4">📖</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Generate a German Passage
          </h3>
          <p className="text-gray-500 mb-6">
            An AI-generated passage tailored to your current level will appear, with comprehension questions.
          </p>

          <div className="flex gap-3 max-w-md mx-auto">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic (optional, e.g. Familie, Reisen)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
            >
              Generate
            </button>
          </div>

          {error && (
            <div className="mt-4 text-red-500 text-sm">{error}</div>
          )}
        </div>
      )}

      {(streaming || done) && (
        <div className="space-y-6">
          {/* Passage header */}
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

          {/* Passage text */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            {streaming && !done ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-sm text-gray-400">AI가 문단을 생성하고 있습니다...</span>
              </div>
            ) : done && passageId ? (
              <>
                <PassageReader
                  text={text}
                  passageId={passageId}
                  wordList={wordList}
                />
                <p className="text-xs text-gray-400 mt-4">
                  단어를 클릭하면 번역이 표시됩니다. 단어장에 저장할 수 있어요.
                </p>
              </>
            ) : null}
          </div>

          {/* Questions */}
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
