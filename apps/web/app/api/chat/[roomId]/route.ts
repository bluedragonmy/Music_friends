/**
 * app/api/chat/[roomId]/route.ts
 * 獲取聊天室詳情、歷史訊息與對方的音樂人格歌單
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!me) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. 查詢房間資訊，確認使用者權限
    const room = await prisma.matchRoom.findUnique({
      where: { id: roomId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.user1Id !== me.id && room.user2Id !== me.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 2. 找出對方的使用者資訊與預設交友歌單 (音樂人格)
    const partnerId = room.user1Id === me.id ? room.user2Id : room.user1Id;
    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        playlists: {
          take: 1,
          orderBy: { updatedAt: "desc" },
          include: {
            tracks: {
              include: { track: true },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner user not found" }, { status: 404 });
    }

    // 3. 回傳整合資料
    return NextResponse.json({
      room: {
        id: room.id,
        status: room.status,
        expiresAt: room.expiresAt,
        createdAt: room.createdAt,
        user1Choice: room.user1Choice,
        user2Choice: room.user2Choice,
        myChoice: room.user1Id === me.id ? room.user1Choice : room.user2Choice,
        partnerChoice: room.user1Id === me.id ? room.user2Choice : room.user1Choice,
      },
      myId: me.id,
      partner,
      messages: room.messages,
    });
  } catch (error) {
    console.error("[Get Chatroom Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch chatroom info", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!me) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const room = await prisma.matchRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.user1Id !== me.id && room.user2Id !== me.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.matchRoom.delete({
      where: { id: roomId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Delete Chatroom Error]:", error);
    return NextResponse.json(
      { error: "Failed to delete chatroom", detail: String(error) },
      { status: 500 }
    );
  }
}
