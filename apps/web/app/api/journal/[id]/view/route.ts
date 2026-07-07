import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { JournalRepository } from "@/lib/journey/repository";

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

    const { readTimeMs } = await request.json();
    if (typeof readTimeMs !== "number" || readTimeMs < 0) {
      return NextResponse.json({ error: "Invalid readTimeMs" }, { status: 400 });
    }

    const entry = await JournalRepository.getJournalEntry(journalId);
    if (!entry) {
      return NextResponse.json({ error: "Journal entry not found" }, { status: 404 });
    }

    const updatedAnalytics = await JournalRepository.recordJournalView(journalId, readTimeMs);
    return NextResponse.json({ success: true, analytics: updatedAnalytics });
  } catch (error: any) {
    console.error("[Journal View API] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
