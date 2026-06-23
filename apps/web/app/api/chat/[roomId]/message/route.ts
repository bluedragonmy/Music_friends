import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
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
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const room = await prisma.matchRoom.findUnique({ where: { id: roomId } });
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    if (room.user1Id !== user.id && room.user2Id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isExpired = room.expiresAt.getTime() <= Date.now();
    if (isExpired || room.status === MatchStatus.CLOSED) {
      return NextResponse.json({ error: "Room is closed or expired" }, { status: 403 });
    }

    const messageId = crypto.randomUUID();
    const now = new Date();

    const broadcastMessage = {
      id: messageId,
      roomId,
      senderId: user.id,
      content,
      createdAt: now,
      sender: {
        name: user.name,
        image: user.image
      }
    };

    // 併發執行 (Concurrent Execution)：
    // 同時發起資料庫寫入與 Pusher 廣播，省下等待資料庫連線與寫入的延遲
    const [dbMessage] = await Promise.all([
      prisma.message.create({
        data: {
          id: messageId,
          roomId,
          senderId: user.id,
          content,
          createdAt: now,
        },
        include: {
          sender: {
            select: { name: true, image: true },
          },
        },
      }),
      pusherServer.trigger(`room-${roomId}`, "receive_message", broadcastMessage)
    ]);

    return NextResponse.json({ success: true, message: dbMessage });
  } catch (error) {
    console.error("[Send Message Error]:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
