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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 取得使用者唯一的 "My Spotify Top Tracks" 歌單，若無則退而求其次取得第一個現存歌單
    let playlist = await prisma.playlist.findFirst({
      where: {
        userId: user.id,
        name: "My Spotify Top Tracks",
      },
      include: {
        tracks: {
          include: {
            track: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!playlist) {
      playlist = await prisma.playlist.findFirst({
        where: {
          userId: user.id,
        },
        include: {
          tracks: {
            include: {
              track: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      });
    }

    if (!playlist) {
      return NextResponse.json({ tracks: [] });
    }

    // 格式化回傳
    const formattedTracks = playlist.tracks.map((pt) => ({
      spotifyId: pt.track.spotifyId,
      title: pt.track.title,
      artist: pt.track.artist,
      album: pt.track.album,
      coverImg: pt.track.coverImg,
      duration: pt.track.duration,
      previewUrl: pt.track.previewUrl,
      url: pt.track.url,
      startTime: pt.startTime !== null ? pt.startTime : 0,
      endTime: pt.endTime !== null ? pt.endTime : 30,
    }));

    return NextResponse.json({ tracks: formattedTracks });
  } catch (error) {
    console.error("[Get My Playlist Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      { status: 500 }
    );
  }
}
