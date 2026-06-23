import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

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
    const { trackId, title, artist, coverImg, previewUrl, startTimestamp } = body;

    // Trigger Pusher event
    await pusherServer.trigger(`room-${roomId}`, "sync_play_invite", {
      senderId: user.id,
      trackId,
      title,
      artist,
      coverImg,
      previewUrl,
      startTimestamp: startTimestamp || Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Sync Invite Error]:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
