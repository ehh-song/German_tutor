"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import useSWR from "swr";
import type { ProgressData } from "@/types";
import { LEVEL_CONFIG } from "@/lib/levels";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AppShell({ children, role = "USER" }: { children: React.ReactNode; role?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") ?? "de";

  const { data: progress } = useSWR<ProgressData>(
    `/api/progress?lang=${lang}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const level = progress?.currentLevel ?? "A1";
  const levelConfig = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG];
  const xpForTest = levelConfig?.xpToUnlockTest;
  const xpPercent = xpForTest ? Math.min(100, ((progress?.xp ?? 0) / xpForTest) * 100) : 100;
  const langInfo = SUPPORTED_LANGUAGES[lang as keyof typeof SUPPORTED_LANGUAGES];

  function withLang(href: string) {
    return `${href}?lang=${lang}`;
  }

  const navItems = [
    { href: withLang("/dashboard"), base: "/dashboard", label: "Dashboard", icon: "🏠" },
    { href: withLang("/learn"),     base: "/learn",      label: "Learn",     icon: "📖" },
    { href: withLang("/vocabulary"),base: "/vocabulary",  label: "Vocab",     icon: "📚" },
    { href: "/languages",           base: "/languages",   label: "Languages", icon: "🌐" },
  ];

  function active(base: string) {
    return pathname === base || pathname.startsWith(base + "/");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Desktop sidebar (md+) ── */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col shrink-0">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-indigo-700">LinguaMaster</h1>
          <p className="text-xs text-gray-400 mt-0.5">AI Language Tutor</p>
        </div>

        {langInfo && (
          <div className="px-4 pt-3">
            <Link href="/languages" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-indigo-50 transition group">
              <span className="text-xl">{langInfo.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-700 truncate">{langInfo.name}</div>
                <div className="text-xs text-gray-400">Switch language</div>
              </div>
              <span className="text-gray-300 group-hover:text-indigo-400 text-xs">⇄</span>
            </Link>
          </div>
        )}

        <div className="p-4 mx-3 mt-3 rounded-xl bg-indigo-50">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-white text-xs font-bold ${levelConfig?.color ?? "bg-green-500"}`}>{level}</span>
            <span className="text-xs text-gray-600 font-medium">{levelConfig?.label}</span>
          </div>
          <div className="text-sm font-bold text-gray-800 mb-1">{progress?.xp ?? 0} XP</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${xpPercent}%` }} />
          </div>
          {progress?.levelUpAvailable && (
            <Link href={withLang("/levelup")} className="mt-2 block text-center text-xs bg-amber-400 hover:bg-amber-500 text-white font-semibold py-1 rounded-lg transition">
              Level-Up Test Available!
            </Link>
          )}
        </div>

        <nav className="flex-1 p-3 mt-2">
          {navItems.slice(0, 3).map((item) => (
            <Link key={item.base} href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 text-sm font-medium transition ${
                active(item.base) ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100"
              }`}>
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-1">
          {role === "ADMIN" && (
            <Link href="/admin" className="flex items-center gap-2 w-full text-sm text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg transition font-medium">
              <span>⚙️</span> Admin Panel
            </Link>
          )}
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-sm text-gray-500 hover:text-red-500 text-left px-4 py-2 rounded-lg hover:bg-red-50 transition">
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Right column: header + content + bottom nav ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top header (hidden on md+) */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-700">LinguaMaster</span>
            {langInfo && <span className="text-lg">{langInfo.flag}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-white text-xs font-bold ${levelConfig?.color ?? "bg-green-500"}`}>{level}</span>
            <span className="text-xs font-semibold text-gray-600">{progress?.xp ?? 0} XP</span>
            {progress?.levelUpAvailable && (
              <Link href={withLang("/levelup")} className="text-xs bg-amber-400 text-white font-semibold px-2 py-0.5 rounded-full animate-pulse">
                ⬆ Level Up!
              </Link>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>

        {/* Mobile bottom navigation (hidden on md+) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200">
          <div className="flex">
            {navItems.map((item) => (
              <Link key={item.base} href={item.href}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                  active(item.base) ? "text-indigo-600" : "text-gray-400"
                }`}>
                <span className="text-xl leading-tight">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium text-gray-400">
              <span className="text-xl leading-tight">🚪</span>
              <span>Sign out</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
