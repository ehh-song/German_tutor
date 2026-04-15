import Anthropic from "@anthropic-ai/sdk";
import type { BetaTextBlockParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
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

const globalForAnthropic = globalThis as unknown as {
  anthropicClient: Anthropic | undefined;
};

export const anthropic =
  globalForAnthropic.anthropicClient ??
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

if (process.env.NODE_ENV !== "production")
  globalForAnthropic.anthropicClient = anthropic;

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text.trim();
}

const cachedSystemBlock: BetaTextBlockParam = {
  type: "text",
  text: PASSAGE_SYSTEM_PROMPT,
  cache_control: { type: "ephemeral" },
};

const cachedLevelUpSystemBlock: BetaTextBlockParam = {
  type: "text",
  text: LEVEL_UP_TEST_SYSTEM_PROMPT,
  cache_control: { type: "ephemeral" },
};

/**
 * Generate a passage with questions using Opus 4.6 with prompt caching.
 * Yields text chunks for SSE streaming, then the full parsed PassageGeneration.
 */
export async function* streamPassageGeneration(
  level: CEFRLevel,
  xpProgress: number,
  topic?: string
): AsyncGenerator<{ type: "chunk"; text: string } | { type: "done"; data: PassageGeneration }> {
  const stream = anthropic.beta.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 3000,
    system: [cachedSystemBlock],
    messages: [
      {
        role: "user",
        content: buildPassageUserPrompt(level, xpProgress, topic),
      },
    ],
    betas: ["prompt-caching-2024-07-31"],
  });

  let fullText = "";

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      fullText += event.delta.text;
      yield { type: "chunk", text: event.delta.text };
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
  const response = await anthropic.beta.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4000,
    system: [cachedLevelUpSystemBlock],
    messages: [
      {
        role: "user",
        content: buildLevelUpTestPrompt(fromLevel, toLevel),
      },
    ],
    betas: ["prompt-caching-2024-07-31"],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text block in response");
  }
  const jsonText = extractJson(textBlock.text);
  return LevelUpTestSchema.parse(JSON.parse(jsonText));
}

/**
 * Translate a single German word using Haiku 4.5 (fast + cheap).
 */
export async function translateWord(
  word: string,
  context: string
): Promise<WordTranslation> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: WORD_TRANSLATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `German word/phrase: "${word}"\nPassage context: "${context.slice(0, 200)}"`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text block in response");
  }
  const jsonText = extractJson(textBlock.text);
  return WordTranslationSchema.parse(JSON.parse(jsonText));
}
