"use client";

import QuestionSet from "@/components/questions/QuestionSet";
import type { QuestionItem, AttemptResult } from "@/types";

interface Props {
  passageId: string;
  questions: QuestionItem[];
}

export default function PassageQuizClient({ passageId, questions }: Props) {
  function handleComplete(result: AttemptResult) {
    // Result is handled inside QuestionSet
    void result;
  }

  return (
    <QuestionSet
      passageId={passageId}
      questions={questions}
      onComplete={handleComplete}
    />
  );
}
