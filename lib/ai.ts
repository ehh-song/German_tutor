import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type { CEFRLevel } from "./levels";
import type { LanguageCode } from "./languages";
import {
  getPassageSystemPrompt,
  getLevelUpTestSystemPrompt,
  getWordTranslationSystemPrompt,
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
  language: LanguageCode = "de",
  topic?: string
): AsyncGenerator<{ type: "chunk"; text: string } | { type: "done"; data: PassageGeneration }> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: getPassageSystemPrompt(language),
  });

  const result = await model.generateContentStream(
    buildPassageUserPrompt(level, xpProgress, topic, language)
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
  toLevel: CEFRLevel,
  language: LanguageCode = "de"
): Promise<z.infer<typeof LevelUpTestSchema>> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: getLevelUpTestSystemPrompt(language),
  });

  const result = await model.generateContent(
    buildLevelUpTestPrompt(fromLevel, toLevel, language)
  );

  const jsonText = extractJson(result.response.text());
  return LevelUpTestSchema.parse(JSON.parse(jsonText));
}

/**
 * Translate a single word using Gemini 2.0 Flash (fast + cheap).
 */
export async function translateWord(
  word: string,
  context: string,
  language: LanguageCode = "de"
): Promise<WordTranslation> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: getWordTranslationSystemPrompt(language),
  });

  const result = await model.generateContent(
    `Word/phrase: "${word}"\nPassage context: "${context.slice(0, 200)}"`
  );

  const jsonText = extractJson(result.response.text());
  return WordTranslationSchema.parse(JSON.parse(jsonText));
}
