import { z } from "zod";

export const WordSchema = z.object({
  word: z.string(),
  translation: z.string(),
  partOfSpeech: z.string(),
});

export const QuestionSchema = z.object({
  type: z.enum(["vocabulary", "comprehension", "grammar"]),
  questionText: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.string(),
  explanation: z.string(),
});

export const PassageGenerationSchema = z.object({
  germanText: z.string(),
  topic: z.string(),
  grammarFocus: z.string(),
  questions: z.array(QuestionSchema).min(3).max(5),
  wordList: z.array(WordSchema),
});

export const LevelUpTestSchema = z.object({
  questions: z.array(QuestionSchema).length(10),
});

export const WordTranslationSchema = z.object({
  translation: z.string(),
  explanation: z.string(),
  partOfSpeech: z.string(),
});

export type PassageGeneration = z.infer<typeof PassageGenerationSchema>;
export type QuestionData = z.infer<typeof QuestionSchema>;
export type WordData = z.infer<typeof WordSchema>;
export type WordTranslation = z.infer<typeof WordTranslationSchema>;
