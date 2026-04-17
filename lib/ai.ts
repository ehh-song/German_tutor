import Anthropic from "@anthropic-ai/sdk";
import type { BetaTextBlockParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
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

// ─── Clients ─────────────────────────────────────────────────────────────────

const globalForAnthropic = globalThis as unknown as {
  anthropicClient: Anthropic | undefined;
};
const anthropic =
  globalForAnthropic.anthropicClient ??
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
if (process.env.NODE_ENV !== "production")
  globalForAnthropic.anthropicClient = anthropic;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY ?? "");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text.trim();
}

function makeSystemBlock(text: string): BetaTextBlockParam {
  return { type: "text", text, cache_control: { type: "ephemeral" } };
}

function isRateLimitError(err: unknown): boolean {
  if (err instanceof Anthropic.RateLimitError) return true;
  if (err instanceof Anthropic.APIError && err.status === 429) return true;
  return false;
}

// ─── Passage generation ───────────────────────────────────────────────────────

async function* streamWithAnthropic(
  level: CEFRLevel,
  xpProgress: number,
  language: LanguageCode,
  topic?: string
): AsyncGenerator<{ type: "chunk"; text: string } | { type: "done"; data: PassageGeneration }> {
  const stream = anthropic.beta.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 3000,
    system: [makeSystemBlock(getPassageSystemPrompt(language))],
    messages: [{ role: "user", content: buildPassageUserPrompt(level, xpProgress, topic, language) }],
    betas: ["prompt-caching-2024-07-31"],
  });

  let fullText = "";
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
      yield { type: "chunk", text: event.delta.text };
    }
  }

  const parsed = PassageGenerationSchema.parse(JSON.parse(extractJson(fullText)));
  yield { type: "done", data: parsed };
}

async function* streamWithGemini(
  level: CEFRLevel,
  xpProgress: number,
  language: LanguageCode,
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

  const parsed = PassageGenerationSchema.parse(JSON.parse(extractJson(fullText)));
  yield { type: "done", data: parsed };
}

export async function* streamPassageGeneration(
  level: CEFRLevel,
  xpProgress: number,
  language: LanguageCode = "de",
  topic?: string
): AsyncGenerator<{ type: "chunk"; text: string } | { type: "done"; data: PassageGeneration }> {
  try {
    yield* streamWithAnthropic(level, xpProgress, language, topic);
  } catch (err) {
    if (isRateLimitError(err)) {
      console.warn("[AI] Claude rate limit hit — falling back to Gemini");
      yield* streamWithGemini(level, xpProgress, language, topic);
    } else {
      throw err;
    }
  }
}

// ─── Level-up test ────────────────────────────────────────────────────────────

export async function generateLevelUpTest(
  fromLevel: CEFRLevel,
  toLevel: CEFRLevel,
  language: LanguageCode = "de"
): Promise<z.infer<typeof LevelUpTestSchema>> {
  try {
    const response = await anthropic.beta.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4000,
      system: [makeSystemBlock(getLevelUpTestSystemPrompt(language))],
      messages: [{ role: "user", content: buildLevelUpTestPrompt(fromLevel, toLevel, language) }],
      betas: ["prompt-caching-2024-07-31"],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No text block");
    return LevelUpTestSchema.parse(JSON.parse(extractJson(textBlock.text)));
  } catch (err) {
    if (isRateLimitError(err)) {
      console.warn("[AI] Claude rate limit hit — falling back to Gemini");
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: getLevelUpTestSystemPrompt(language),
      });
      const result = await model.generateContent(buildLevelUpTestPrompt(fromLevel, toLevel, language));
      return LevelUpTestSchema.parse(JSON.parse(extractJson(result.response.text())));
    }
    throw err;
  }
}

// ─── Word translation ─────────────────────────────────────────────────────────

export async function translateWord(
  word: string,
  context: string,
  language: LanguageCode = "de"
): Promise<WordTranslation> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: getWordTranslationSystemPrompt(language),
      messages: [{ role: "user", content: `Word/phrase: "${word}"\nPassage context: "${context.slice(0, 200)}"` }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No text block");
    return WordTranslationSchema.parse(JSON.parse(extractJson(textBlock.text)));
  } catch (err) {
    if (isRateLimitError(err)) {
      console.warn("[AI] Claude rate limit hit — falling back to Gemini");
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: getWordTranslationSystemPrompt(language),
      });
      const result = await model.generateContent(
        `Word/phrase: "${word}"\nPassage context: "${context.slice(0, 200)}"`
      );
      return WordTranslationSchema.parse(JSON.parse(extractJson(result.response.text())));
    }
    throw err;
  }
}
