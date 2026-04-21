"use client";

import { useState } from "react";
import useSWR from "swr";
import type { VocabWord } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const partOfSpeechBadge: Record<string, string> = {
  noun: "bg-blue-100 text-blue-700",
  verb: "bg-green-100 text-green-700",
  adjective: "bg-yellow-100 text-yellow-700",
  adverb: "bg-orange-100 text-orange-700",
  preposition: "bg-purple-100 text-purple-700",
};

export default function VocabBook({ language = "de" }: { language?: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, mutate } = useSWR<{
    words: VocabWord[];
    total: number;
    totalPages: number;
  }>(`/api/vocabulary?page=${page}&lang=${language}`, fetcher);

  async function handleDelete(id: string) {
    await fetch(`/api/vocabulary/${id}`, { method: "DELETE" });
    mutate();
  }

  const filtered = data?.words.filter((w) =>
    search
      ? w.word.toLowerCase().includes(search.toLowerCase()) ||
        w.translation.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search words..."
          className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
        />
      </div>

      {!data ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📚</div>
          <div className="text-gray-500 font-medium">
            {search ? "No matching words found" : "No words saved yet"}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            Click on words while reading passages to save them here
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered?.map((word) => (
            <div
              key={word.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900">{word.word}</span>
                    {word.partOfSpeech && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          partOfSpeechBadge[word.partOfSpeech.toLowerCase()] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {word.partOfSpeech}
                      </span>
                    )}
                  </div>
                  <div className="text-indigo-600 font-medium text-sm mt-0.5">
                    {word.translation}
                  </div>
                  {word.explanation && (
                    <div className="text-gray-500 text-xs mt-1 leading-relaxed">
                      {word.explanation}
                    </div>
                  )}
                  <div className="text-gray-300 text-xs mt-2">
                    Saved {new Date(word.savedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(word.id)}
                  className="ml-3 text-gray-300 hover:text-red-400 transition text-lg leading-none"
                  title="Remove from vocabulary"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
            className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
