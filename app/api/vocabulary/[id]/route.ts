import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const word = await prisma.vocabularyWord.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!word) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.vocabularyWord.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
