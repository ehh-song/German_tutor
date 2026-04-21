import { z } from "zod";

// Normalizes a raw AI response object: handles both snake_case and camelCase keys
function normalize(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Convert snake_case to camelCase
    const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    if (Array.isArray(value)) {
      result[camel] = value.map((v) =>
        v && typeof v === "object" ? normalize(v as Record<string, unknown>) : v
      );
    } else if (value && typeof value === "object") {
      result[camel] = normalize(value as Record<string, unknown>);
    } else {
      result[camel] = value;
    }
  }
  return result;
}

const preprocessed = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return normalize(val as Record<string, unknown>);
    }
    return val;
  }, schema);

export const WordSchema = preprocessed(
  z.object({
    word: z.string(),
    translation: z.string(),
    partOfSpeech: z.string().optional().default(""),
  })
);

export const QuestionSchema = preprocessed(
  z.object({
    type: z
      .string()
      .transform((t) => {
        const lower = t.toLowerCase();
        if (lower.includes("vocab")) return "vocabulary";
        if (lower.includes("grammar")) return "grammar";
        return "comprehension";
      })
      .pipe(z.enum(["vocabulary", "comprehension", "grammar"])),
    questionText: z.string(),
    options: z.array(z.string()).min(2).max(6).transform((opts) => opts.slice(0, 4)),
    correctAnswer: z.string(),
    explanation: z.string(),
  })
);

export const PassageGenerationSchema = preprocessed(
  z.object({
    passageText: z.string().optional(),
    germanText: z.string().optional(), // legacy field name from AI prompt
    topic: z.string(),
    grammarFocus: z.string(),
    questions: z.array(QuestionSchema).min(3).transform((qs) => qs.slice(0, 5)),
    wordList: z.array(WordSchema).default([]),
  }).transform((data) => ({
    passageText: data.passageText ?? data.germanText ?? "",
    topic: data.topic,
    grammarFocus: data.grammarFocus,
    questions: data.questions,
    wordList: data.wordList,
  }))
);

export const LevelUpTestSchema = preprocessed(
  z.object({
    questions: z
      .array(QuestionSchema)
      .min(5)
      .transform((qs) => qs.slice(0, 10)),
  })
);

export const WordTranslationSchema = preprocessed(
  z.object({
    translation: z.string(),
    explanation: z.string().optional().default(""),
    partOfSpeech: z.string().optional().default(""),
  })
);

export type PassageGeneration = z.infer<typeof PassageGenerationSchema>; // has passageText field
export type QuestionData = z.infer<typeof QuestionSchema>;
export type WordData = z.infer<typeof WordSchema>;
export type WordTranslation = z.infer<typeof WordTranslationSchema>;
