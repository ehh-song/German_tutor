"use client";

import type { QuestionItem } from "@/types";

interface Props {
  question: QuestionItem;
  selectedAnswer: string | null;
  feedback: { correct: boolean; explanation: string; correctAnswer: string } | null;
  onAnswer: (questionId: string, answer: string) => void;
}

const typeLabels: Record<string, string> = {
  vocabulary: "Vocabulary",
  comprehension: "Comprehension",
  grammar: "Grammar",
};

const typeColors: Record<string, string> = {
  vocabulary: "bg-blue-100 text-blue-700",
  comprehension: "bg-green-100 text-green-700",
  grammar: "bg-purple-100 text-purple-700",
};

export default function QuestionCard({ question, selectedAnswer, feedback, onAnswer }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[question.type] ?? "bg-gray-100 text-gray-600"}`}>
          {typeLabels[question.type] ?? question.type}
        </span>
      </div>

      <p className="text-gray-800 font-medium mb-4">{question.questionText}</p>

      <div className="space-y-2">
        {question.options.map((option) => {
          let optionClass =
            "w-full text-left px-4 py-2.5 rounded-lg border text-sm transition ";

          if (!feedback) {
            optionClass +=
              selectedAnswer === option
                ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50";
          } else {
            if (option === feedback.correctAnswer) {
              optionClass += "border-green-500 bg-green-50 text-green-800";
            } else if (option === selectedAnswer && !feedback.correct) {
              optionClass += "border-red-400 bg-red-50 text-red-700";
            } else {
              optionClass += "border-gray-200 text-gray-400";
            }
          }

          return (
            <button
              key={option}
              onClick={() => !feedback && onAnswer(question.id, option)}
              disabled={!!feedback}
              className={optionClass}
            >
              {option}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div
          className={`mt-3 p-3 rounded-lg text-sm ${
            feedback.correct ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          <span className="font-medium">{feedback.correct ? "Correct!" : "Incorrect."}</span>{" "}
          {feedback.explanation}
        </div>
      )}
    </div>
  );
}
