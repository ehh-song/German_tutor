"use client";

import { useState, useEffect, useRef } from "react";
import type { WordItem } from "@/types";

interface Props {
  word: string;
  passageId: string;
  wordListEntry?: WordItem;
  passageContext: string;
}

export default function WordTooltip({ word, passageId, wordListEntry, passageContext }: Props) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const [translation, setTranslation] = useState<{
    translation: string;
    explanation: string;
    partOfSpeech: string;
  } | null>(wordListEntry ? {
    translation: wordListEntry.translation,
    explanation: "",
    partOfSpeech: wordListEntry.partOfSpeech,
  } : null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen((o) => !o);

    if (!translation && !wordListEntry) {
      setSaving(true);
      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ germanWord: word, passageId, passageContext }),
      });
      if (res.ok) {
        const data = await res.json();
        setTranslation({
          translation: data.translation,
          explanation: data.explanation,
          partOfSpeech: data.partOfSpeech ?? "",
        });
        setSaved(true);
      }
      setSaving(false);
    }
  }

  async function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    if (saved || saving) return;
    setSaving(true);

    const res = await fetch("/api/vocabulary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        germanWord: word,
        passageId,
        passageContext,
        translation: translation?.translation,
        partOfSpeech: translation?.partOfSpeech,
      }),
    });

    if (res.ok) setSaved(true);
    setSaving(false);
  }

  return (
    <span className="relative inline-block" ref={containerRef}>
      <span
        onClick={handleClick}
        className="cursor-pointer hover:bg-indigo-100 hover:text-indigo-800 rounded px-0.5 transition"
      >
        {word}
      </span>

      {open && (
        <div
          className="absolute z-50 top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between mb-1">
            <span className="font-bold text-gray-900">{word}</span>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-xs ml-2"
            >
              ✕
            </button>
          </div>

          {saving && !translation ? (
            <div className="text-sm text-gray-400">Looking up...</div>
          ) : translation ? (
            <>
              <div className="text-sm text-indigo-700 font-medium">{translation.translation}</div>
              {translation.partOfSpeech && (
                <div className="text-xs text-gray-400 italic">{translation.partOfSpeech}</div>
              )}
              {translation.explanation && (
                <div className="text-xs text-gray-500 mt-1">{translation.explanation}</div>
              )}

              {!saved ? (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-2 w-full text-xs bg-indigo-500 hover:bg-indigo-600 text-white py-1 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "단어장에 저장"}
                </button>
              ) : (
                <div className="mt-2 text-xs text-green-600 text-center">단어장에 저장됨 ✓</div>
              )}
            </>
          ) : null}
        </div>
      )}
    </span>
  );
}
