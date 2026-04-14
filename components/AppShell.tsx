"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import useSWR from "swr";
import type { ProgressData } from "@/types";
import { LEVEL_CONFIG } from "@/lib/levels";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/learn", label: "Learn", icon: "📖" },
  { href: "/vocabulary", label: "Vocabulary", icon: "📚" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: progress } = useSWR<ProgressData>("/api/progress", fetcher, {
    refreshInterval: 30000,
  });

  const level = progress?.currentLevel ?? "A1";
  const levelConfig = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG];
  const xpForTest = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG]?.xpToUnlockTest;
  const xpPercent = xpForTest ? Math.min(100, ((progress?.xp ?? 0) / xpForTest) * 100) : 100;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-indigo-700">Deutsch Meister</h1>
          <p className="text-xs text-gray-400 mt-0.5">German Learning App</p>
        </div>

        {/* Level + XP */}
        <div className="p-4 mx-3 mt-4 rounded-xl bg-indigo-50">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-white text-xs font-bold ${levelConfig?.color ?? "bg-green-500"}`}>
              {level}
            </span>
            <span className="text-xs text-gray-600 font-medium">{levelConfig?.label}</span>
          </div>
          <div className="text-sm font-bold text-gray-800 mb-1">{progress?.xp ?? 0} XP</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          {progress?.levelUpAvailable && (
            <Link
              href="/levelup"
              className="mt-2 block text-center text-xs bg-amber-400 hover:bg-amber-500 text-white font-semibold py-1 rounded-lg transition"
            >
              Level-Up Test Available!
            </Link>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 mt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-sm text-gray-500 hover:text-red-500 text-left px-4 py-2 rounded-lg hover:bg-red-50 transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
