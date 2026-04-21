import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Read current path to avoid redirecting if already on /languages
  const headersList = await headers();
  const pathname =
    headersList.get("x-invoke-path") ??
    headersList.get("x-pathname") ??
    "";
  const isLanguagesPage = pathname === "/languages" || pathname.startsWith("/languages/");

  if (!isLanguagesPage) {
    const hasProgress = await prisma.userProgress.findFirst({
      where: { userId: session.user.id as string },
    });
    if (!hasProgress) {
      redirect("/languages");
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { role: true },
  });
  const role = user?.role ?? "USER";

  return <AppShell role={role}>{children}</AppShell>;
}
