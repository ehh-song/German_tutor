"use client";

import WordTooltip from "./WordTooltip";
import type { WordItem } from "@/types";

interface Props {
  text: string;
  passageId: string;
  wordList: WordItem[];
}

function tokenize(text: string): string[] {
  // Split on word boundaries while keeping punctuation separate
  return text.split(/(\s+|[.,!?;:()"„"–—])/).filter(Boolean);
}

function isGermanWord(token: string): boolean {
  return /^[a-zA-ZäöüÄÖÜß]{2,}$/.test(token);
}

export default function PassageReader({ text, passageId, wordList }: Props) {
  const wordMap = new Map<string, WordItem>(
    wordList.map((w) => [w.word.toLowerCase(), w])
  );

  const tokens = tokenize(text);

  return (
    <div
      className="text-lg leading-8 text-gray-800 select-text"
      onClick={() => {
        // Close any open tooltips when clicking the passage background
      }}
    >
      {tokens.map((token, i) => {
        if (!isGermanWord(token)) {
          return <span key={i}>{token}</span>;
        }

        const entry = wordMap.get(token.toLowerCase());
        return (
          <WordTooltip
            key={i}
            word={token}
            passageId={passageId}
            wordListEntry={entry}
            passageContext={text}
          />
        );
      })}
    </div>
  );
}
