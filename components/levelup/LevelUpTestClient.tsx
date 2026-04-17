"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QuestionCard from "@/components/questions/QuestionCard";
import type { QuestionItem } from "@/types";

interface Props {
  testId: string;
  questions: QuestionItem[];
  language?: string;
}

interface TestResult {
  score: number;
  passed: boolean;
  correct: number;
  total: number;
  explanations: Record<string, { correct: boolean; explanation: string; correctAnswer: string }>;
  newLevel: string;
  xpBonus: number;
}

export default function LevelUpTestClient({ testId, questions, language = "de" }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  function handleAnswer(questionId: string, answer: string) {
    if (submitted) return;
    setAnswers((a) => ({ ...a, [questionId]: answer }));
  }

  async function handleSubmit() {
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      alert(`Please answer all ${unanswered.length} remaining questions.`);
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/levelup/${testId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });

    if (res.ok) {
      const data: TestResult = await res.json();
      setResult(data);
      setSubmitted(true);
    }
    setLoading(false);
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">
          {answeredCount} / {questions.length} answered
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                answers[`q${i}`] ? "bg-indigo-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
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
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Submit Test"}
        </button>
      ) : result ? (
        <div className={`rounded-xl p-6 text-center ${result.passed ? "bg-green-50 border border-green-200" : "bg-orange-50 border border-orange-200"}`}>
          <div className="text-4xl mb-2">{result.passed ? "🎉" : "📚"}</div>
          <div className={`text-3xl font-bold mb-1 ${result.passed ? "text-green-700" : "text-orange-600"}`}>
            {result.score}%
          </div>
          <div className="text-gray-600 mb-2">
            {result.correct} / {result.total} correct
          </div>

          {result.passed ? (
            <>
              <div className="text-green-700 font-semibold mb-1">
                You&apos;ve advanced to {result.newLevel}!
              </div>
              <div className="text-green-600 text-sm mb-4">+{result.xpBonus} XP bonus earned!</div>
              <button
                onClick={() => router.push(`/dashboard?lang=${language}`)}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
              >
                Back to Dashboard
              </button>
            </>
          ) : (
            <>
              <div className="text-orange-700 font-semibold mb-1">
                Not quite — keep practising!
              </div>
              <div className="text-gray-500 text-sm mb-4">
                You need 70% to advance. Keep completing passages and try again.
              </div>
              <button
                onClick={() => router.push(`/learn?lang=${language}`)}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
              >
                Continue Learning
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
