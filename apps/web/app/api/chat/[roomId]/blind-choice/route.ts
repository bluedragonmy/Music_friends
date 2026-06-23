import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { MatchStatus } from "@/app/generated/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { choice } = body;

    if (choice !== "KEEP" && choice !== "END") {
      return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
    }

    const room = await prisma.matchRoom.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    if (room.status === MatchStatus.MATCHED) {
      return NextResponse.json({ error: "Already matched" }, { status: 400 });
    }

    const isUser1 = room.user1Id === user.id;
    const updateData = isUser1 ? { user1Choice: choice } : { user2Choice: choice };

    const updatedRoom = await prisma.matchRoom.update({
      where: { id: roomId },
      data: updateData,
    });

    const u1Choice = updatedRoom.user1Choice;
    const u2Choice = updatedRoom.user2Choice;

    if (u1Choice && u2Choice) {
      let finalStatus: MatchStatus = MatchStatus.CLOSED;
      if (u1Choice === "KEEP" && u2Choice === "KEEP") {
        finalStatus = MatchStatus.MATCHED;
      }

      const resolvedRoom = await prisma.matchRoom.update({
        where: { id: roomId },
        data: { status: finalStatus },
      });

      await pusherServer.trigger(`room-${roomId}`, "blind_choice_resolved", {
        status: resolvedRoom.status,
        user1Choice: resolvedRoom.user1Choice,
        user2Choice: resolvedRoom.user2Choice,
      });
    } else {
      await pusherServer.trigger(`room-${roomId}`, "blind_choice_submitted", {
        submittedUserId: user.id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Blind Choice Error]:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
