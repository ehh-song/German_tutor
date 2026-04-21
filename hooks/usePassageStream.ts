import { useState, useCallback } from "react";
import type { QuestionItem, WordItem } from "@/types";

interface StreamState {
  streaming: boolean;
  text: string;
  passageId: string | null;
  topic: string | null;
  grammarFocus: string | null;
  wordList: WordItem[];
  questions: QuestionItem[];
  error: string | null;
  done: boolean;
}

export function usePassageStream() {
  const [state, setState] = useState<StreamState>({
    streaming: false,
    text: "",
    passageId: null,
    topic: null,
    grammarFocus: null,
    wordList: [],
    questions: [],
    error: null,
    done: false,
  });

  const generate = useCallback(async (topic?: string, language = "de") => {
    setState({
      streaming: true,
      text: "",
      passageId: null,
      topic: null,
      grammarFocus: null,
      wordList: [],
      questions: [],
      error: null,
      done: false,
    });

    try {
      const res = await fetch("/api/passages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, language }),
      });

      if (!res.ok) {
        setState((s) => ({ ...s, streaming: false, error: "Failed to generate passage" }));
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setState((s) => ({ ...s, streaming: false, error: "No response stream" }));
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const event = JSON.parse(data);
            if (event.type === "chunk") {
              // Accumulate raw chunks but don't display them (they're raw JSON)
            } else if (event.type === "done") {
              setState((s) => ({
                ...s,
                streaming: false,
                done: true,
                text: event.passageText ?? s.text,
                passageId: event.passageId,
                topic: event.topic,
                grammarFocus: event.grammarFocus,
                wordList: event.wordList ?? [],
                questions: event.questions ?? [],
              }));
            } else if (event.type === "error") {
              setState((s) => ({ ...s, streaming: false, error: event.error }));
            }
          } catch {
            // ignore parse errors for partial lines
          }
        }
      }
    } catch (err) {
      setState((s) => ({
        ...s,
        streaming: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      streaming: false,
      text: "",
      passageId: null,
      topic: null,
      grammarFocus: null,
      wordList: [],
      questions: [],
      error: null,
      done: false,
    });
  }, []);

  return { ...state, generate, reset };
}
