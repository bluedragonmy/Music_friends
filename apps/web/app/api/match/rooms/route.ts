/**
 * app/api/match/rooms/route.ts
 * 撈取目前與登入用戶相關的所有配對聊天室清單，方便前端快速點擊進入測試
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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

    // 撈取與我相關的所有聊天室
    const rooms = await prisma.matchRoom.findMany({
      where: {
        OR: [{ user1Id: me.id }, { user2Id: me.id }],
      },
      include: {
        user1: {
          select: { id: true, name: true, image: true, email: true },
        },
        user2: {
          select: { id: true, name: true, image: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 整理成乾淨的格式回傳給前端
    const formattedRooms = rooms.map((room) => {
      const partner = room.user1Id === me.id ? room.user2 : room.user1;
      return {
        id: room.id,
        status: room.status,
        expiresAt: room.expiresAt,
        createdAt: room.createdAt,
        partner: {
          id: partner.id,
          name: partner.name || partner.email,
          image: partner.image,
        },
      };
    });

    return NextResponse.json(formattedRooms);
  } catch (error) {
    console.error("[Get Match Rooms Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch match rooms" },
      { status: 500 }
    );
  }
}
