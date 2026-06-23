import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userSession = await getServerSession(authOptions);
    if (!userSession?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: userSession.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Retrieve active match rooms involving current user with latest message details
    const matchRooms = await prisma.matchRoom.findMany({
      where: {
        OR: [
          { user1Id: currentUser.id },
          { user2Id: currentUser.id },
        ],
      },
      include: {
        user1: {
          select: { id: true, name: true, image: true },
        },
        user2: {
          select: { id: true, name: true, image: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true, senderId: true },
        },
      },
    });

    // Structure room objects with partner information and choice preferences
    const processedRooms = matchRooms.map((room) => {
      const isUser1 = room.user1Id === currentUser.id;
      const partner = isUser1 ? room.user2 : room.user1;
      const myChoice = isUser1 ? room.user1Choice : room.user2Choice;
      const partnerChoice = isUser1 ? room.user2Choice : room.user1Choice;

      const lastMsg = room.messages.length > 0 ? room.messages[0] : null;

      return {
        id: room.id,
        status: room.status,
        expiresAt: room.expiresAt,
        createdAt: room.createdAt,
        myChoice,
        partnerChoice,
        partner: {
          id: partner.id,
          name: partner.name,
          image: partner.image,
        },
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              createdAt: lastMsg.createdAt,
              isMine: lastMsg.senderId === currentUser.id,
            }
          : null,
      };
    });

    // Sort rooms chronologically based on latest activity
    processedRooms.sort((a, b) => {
      const timestampA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
      const timestampB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
      return timestampB - timestampA;
    });

    return NextResponse.json({ rooms: processedRooms });
  } catch (err) {
    console.error("[Chat Room List API Route Failure]:", err);
    return NextResponse.json(
      { error: "Failed to fetch chat rooms" },
      { status: 500 }
    );
  }
}
