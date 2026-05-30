import { prisma } from "@/lib/prisma";
async function main() {
  const updated = await prisma.user.update({
    where: { email: "testuser@example.com" },
    data: { isActive: true, role: "ADMIN" }
  });
  console.log("Updated:", updated.email, updated.isActive, updated.role);
  await prisma.$disconnect();
}
main().catch(console.error);
