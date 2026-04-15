import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type { CEFRLevel } from "./levels";
import {
  PASSAGE_SYSTEM_PROMPT,
  LEVEL_UP_TEST_SYSTEM_PROMPT,
  WORD_TRANSLATION_SYSTEM_PROMPT,
  buildPassageUserPrompt,
  buildLevelUpTestPrompt,
} from "./prompts";
import {
  PassageGenerationSchema,
  LevelUpTestSchema,
  WordTranslationSchema,
  type PassageGeneration,
  type WordTranslation,
} from "./schemas";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text.trim();
}

/**
 * Generate a passage with questions using Gemini 2.0 Flash with SSE streaming.
 * Yields text chunks for SSE streaming, then the full parsed PassageGeneration.
 */
export async function* streamPassageGeneration(
  level: CEFRLevel,
  xpProgress: number,
  topic?: string
): AsyncGenerator<{ type: "chunk"; text: string } | { type: "done"; data: PassageGeneration }> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: PASSAGE_SYSTEM_PROMPT,
  });

  const result = await model.generateContentStream(
    buildPassageUserPrompt(level, xpProgress, topic)
  );

  let fullText = "";

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      fullText += text;
      yield { type: "chunk", text };
    }
  }

  const jsonText = extractJson(fullText);
  const parsed = PassageGenerationSchema.parse(JSON.parse(jsonText));
  yield { type: "done", data: parsed };
}

/**
 * Generate a level-up test (non-streaming).
 */
export async function generateLevelUpTest(
  fromLevel: CEFRLevel,
  toLevel: CEFRLevel
): Promise<z.infer<typeof LevelUpTestSchema>> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: LEVEL_UP_TEST_SYSTEM_PROMPT,
  });

  const result = await model.generateContent(
    buildLevelUpTestPrompt(fromLevel, toLevel)
  );

  const jsonText = extractJson(result.response.text());
  return LevelUpTestSchema.parse(JSON.parse(jsonText));
}

/**
 * Translate a single German word using Gemini 2.0 Flash (fast + cheap).
 */
export async function translateWord(
  word: string,
  context: string
): Promise<WordTranslation> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: WORD_TRANSLATION_SYSTEM_PROMPT,
  });

  const result = await model.generateContent(
    `German word/phrase: "${word}"\nPassage context: "${context.slice(0, 200)}"`
  );

  const jsonText = extractJson(result.response.text());
  return WordTranslationSchema.parse(JSON.parse(jsonText));
}
