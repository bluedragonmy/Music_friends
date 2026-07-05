import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: journalId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { feedback } = await request.json();
    if (!feedback || !["LIKE", "UNSURE", "DISAGREE"].includes(feedback)) {
      return NextResponse.json(
        { error: "Invalid feedback value. Must be 'LIKE', 'UNSURE', or 'DISAGREE'." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 確保該 JournalEntry 確實屬於目前的使用者
    const existingEntry = await prisma.journalEntry.findUnique({
      where: { id: journalId },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
    }

    if (existingEntry.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 更新反饋
    const updatedEntry = await prisma.journalEntry.update({
      where: { id: journalId },
      data: {
        feedback,
        feedbackAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updatedEntry });
  } catch (error) {
    console.error("[Journal Feedback API error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
