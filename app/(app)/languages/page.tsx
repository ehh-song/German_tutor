"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/languages";
import { LEVEL_CONFIG } from "@/lib/levels";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface LanguageProgress {
  language: string;
  name: string;
  nativeName: string;
  flag: string;
  currentLevel: string;
  xp: number;
  totalPassages: number;
}

export default function LanguagesPage() {
  const router = useRouter();
  const { data, isLoading } = useSWR<{ languages: LanguageProgress[] }>("/api/languages", fetcher);
  const [showModal, setShowModal] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  const activeLanguages = data?.languages ?? [];
  const activeCodes = new Set(activeLanguages.map((l) => l.language));
  const availableToStart = Object.entries(SUPPORTED_LANGUAGES).filter(
    ([code]) => !activeCodes.has(code)
  );

  async function startLanguage(code: LanguageCode) {
    setStarting(code);
    try {
      const res = await fetch("/api/languages/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: code }),
      });
      if (res.ok) {
        await mutate("/api/languages");
        setShowModal(false);
        router.push(`/dashboard?lang=${code}`);
      }
    } finally {
      setStarting(null);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">My Languages</h2>
        <p className="text-gray-400 mt-1">Choose a language to continue learning</p>
      </div>

      {isLoading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="space-y-3">
          {activeLanguages.map((lang) => {
            const levelConfig = LEVEL_CONFIG[lang.currentLevel as keyof typeof LEVEL_CONFIG];
            const xpForTest = levelConfig?.xpToUnlockTest;
            const xpPercent = xpForTest ? Math.min(100, (lang.xp / xpForTest) * 100) : 100;

            return (
              <div
                key={lang.language}
                className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-5 hover:border-indigo-300 hover:shadow-sm transition cursor-pointer"
                onClick={() => router.push(`/dashboard?lang=${lang.language}`)}
              >
                <span className="text-4xl">{lang.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{lang.name}</span>
                    <span className="text-sm text-gray-400">{lang.nativeName}</span>
                    <span
                      className={`ml-auto px-2 py-0.5 rounded-full text-white text-xs font-bold ${levelConfig?.color ?? "bg-green-500"}`}
                    >
                      {lang.currentLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${xpPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{lang.xp} XP</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{lang.totalPassages} passages</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard?lang=${lang.language}`);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition"
                >
                  Continue
                </button>
              </div>
            );
          })}

          {availableToStart.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="w-full rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-300 p-5 text-gray-400 hover:text-indigo-500 font-medium transition flex items-center justify-center gap-2"
            >
              <span className="text-xl">+</span> Start a new language
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Choose a language</h3>
            <div className="space-y-2">
              {availableToStart.map(([code, info]) => (
                <button
                  key={code}
                  disabled={starting === code}
                  onClick={() => startLanguage(code as LanguageCode)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition text-left disabled:opacity-50"
                >
                  <span className="text-2xl">{info.flag}</span>
                  <div>
                    <div className="font-semibold text-gray-800">{info.name}</div>
                    <div className="text-xs text-gray-400">{info.nativeName}</div>
                  </div>
                  {starting === code && (
                    <span className="ml-auto text-xs text-indigo-500">Starting...</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full text-sm text-gray-400 hover:text-gray-600 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
