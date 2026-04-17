import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN") redirect("/languages");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <a href="/languages" className="text-indigo-200 hover:text-white text-sm">
          ← Back to App
        </a>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
