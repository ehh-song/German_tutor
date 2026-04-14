"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QuestionCard from "./QuestionCard";
import type { QuestionItem, AttemptResult } from "@/types";

interface Props {
  passageId: string;
  questions: QuestionItem[];
  onComplete: (result: AttemptResult) => void;
}

export default function QuestionSet({ passageId, questions, onComplete }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleAnswer(questionId: string, answer: string) {
    if (submitted) return;
    setAnswers((a) => ({ ...a, [questionId]: answer }));
  }

  async function handleSubmit() {
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      alert(`Please answer all questions. (${unanswered.length} remaining)`);
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/passages/${passageId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });

    if (res.ok) {
      const data: AttemptResult = await res.json();
      setResult(data);
      setSubmitted(true);
      onComplete(data);
    }
    setLoading(false);
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Questions</h3>
        <span className="text-sm text-gray-400">
          {answeredCount} / {questions.length} answered
        </span>
      </div>

      {questions.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          selectedAnswer={answers[q.id] ?? null}
          feedback={result ? result.explanations[q.id] ?? null : null}
          onAnswer={handleAnswer}
        />
      ))}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={loading || answeredCount < questions.length}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Submit Answers"}
        </button>
      ) : result ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div
            className={`text-4xl font-bold mb-2 ${
              result.score >= 80 ? "text-green-600" : result.score >= 60 ? "text-yellow-600" : "text-red-500"
            }`}
          >
            {result.score}%
          </div>
          <div className="text-gray-600 mb-1">
            {result.correctAnswers} / {result.totalQuestions} correct
          </div>
          <div className="text-lg font-semibold text-indigo-600 mb-4">
            +{result.xpEarned} XP earned!
          </div>

          {result.levelUpAvailable && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="font-semibold text-amber-800 text-sm">Level-Up Test Unlocked!</div>
              <button
                onClick={() => router.push("/levelup")}
                className="mt-1 text-xs text-amber-600 hover:underline"
              >
                Take the test now
              </button>
            </div>
          )}

          <button
            onClick={() => router.push("/learn")}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
          >
            New Passage
          </button>
        </div>
      ) : null}
    </div>
  );
}
