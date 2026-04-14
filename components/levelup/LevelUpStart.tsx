"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  existingTestId: string | null;
}

export default function LevelUpStart({ existingTestId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStart() {
    if (existingTestId) {
      router.push(`/levelup/${existingTestId}`);
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/levelup/generate", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      router.push(`/levelup/${data.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to generate test");
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <button
        onClick={handleStart}
        disabled={loading}
        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Preparing test..." : existingTestId ? "Continue Test" : "Start Level-Up Test"}
      </button>
    </div>
  );
}
