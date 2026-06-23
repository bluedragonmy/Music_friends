/**
 * app/api/youtube/sync/route.ts
 * 將 YouTube Music 的喜歡影片資料存入資料庫，建立「YouTube Music 人格」歌單
 * 與 Spotify 的 /api/playlists/sync 邏輯相同，但使用 youtubeId 作為唯一鍵
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
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

    const body = await req.json();
    const tracks = body.tracks;

    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json(
        { error: "Invalid data format: tracks array is required" },
        { status: 400 }
      );
    }

    // 1. 將每首 YouTube 影片 upsert 進 Track 表
    const trackIds: string[] = [];
    for (const t of tracks) {
      const track = await prisma.track.upsert({
        where: { youtubeId: t.youtubeId },
        update: {
          title: t.title,
          artist: t.artist,
          album: t.album,
          coverImg: t.coverImg,
          duration: t.duration,
          url: t.url || "",
        },
        create: {
          youtubeId: t.youtubeId,
          title: t.title,
          artist: t.artist,
          album: t.album || "YouTube Music",
          coverImg: t.coverImg,
          duration: t.duration,
          url: t.url || `https://www.youtube.com/watch?v=${t.youtubeId}`,
        },
      });
      trackIds.push(track.id);
    }

    // 2. 尋找或建立「YouTube Music Top Tracks」歌單
    let playlist = await prisma.playlist.findFirst({
      where: {
        userId: user.id,
        name: "My YouTube Music Top Tracks",
      },
    });

    if (!playlist) {
      playlist = await prisma.playlist.create({
        data: {
          userId: user.id,
          name: "My YouTube Music Top Tracks",
          description: "Auto-synced from YouTube Music Liked Videos",
          coverImg: tracks[0]?.coverImg || null,
        },
      });
    }

    // 3. 全量更新 PlaylistTrack 關聯
    await prisma.playlistTrack.deleteMany({
      where: { playlistId: playlist.id },
    });

    const playlistTrackData = trackIds.map((trackId, index) => ({
      playlistId: playlist!.id,
      trackId: trackId,
      order: index + 1,
    }));

    await prisma.playlistTrack.createMany({
      data: playlistTrackData,
    });

    return NextResponse.json({
      message: "YouTube Music sync successful",
      playlistId: playlist.id,
      syncedTracksCount: trackIds.length,
    });
  } catch (error) {
    console.error("[YouTube Sync Error]:", error);
    return NextResponse.json(
      { error: "Failed to sync YouTube tracks to database", detail: String(error) },
      { status: 500 }
    );
  }
}
