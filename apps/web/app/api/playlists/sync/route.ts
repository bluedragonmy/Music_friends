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

    if (!tracks || !Array.isArray(tracks)) {
      return NextResponse.json(
        { error: "Invalid data format: tracks array is required" },
        { status: 400 }
      );
    }

    // 1. 直接使用前端傳入的歌曲資料（previewUrl 來自 Spotify 原生，null 就是 null，不額外爬取）
    const resolvedTracks = tracks;


    // 2. 確保每一首歌都被存入/更新到 Track 表
    const trackIds: string[] = [];
    for (const t of resolvedTracks) {
      const track = await prisma.track.upsert({
        where: { spotifyId: t.spotifyId },
        update: {
          title: t.title,
          artist: t.artist,
          album: t.album,
          coverImg: t.coverImg,
          duration: t.duration,
          url: t.previewUrl || "",
          previewUrl: t.previewUrl || null,
        },
        create: {
          spotifyId: t.spotifyId,
          title: t.title,
          artist: t.artist,
          album: t.album,
          coverImg: t.coverImg,
          duration: t.duration,
          url: t.previewUrl || "",
          previewUrl: t.previewUrl || null,
        },
      });
      trackIds.push(track.id);
    }

    // 2. 尋找或建立使用者的「Spotify Top Tracks」歌單
    let playlist = await prisma.playlist.findFirst({
      where: {
        userId: user.id,
        name: "My Spotify Top Tracks",
      },
    });

    if (!playlist) {
      playlist = await prisma.playlist.create({
        data: {
          userId: user.id,
          name: "My Spotify Top Tracks",
          description: "Auto-synced from Spotify",
          coverImg: tracks[0]?.coverImg || null,
        },
      });
    }

    // 3. 更新 PlaylistTrack 關聯
    // 先清除這個 Playlist 原本的曲目 (全量更新)
    await prisma.playlistTrack.deleteMany({
      where: { playlistId: playlist.id },
    });

    // 將新抓回來的 5 首歌關聯進去，寫入 order 排序與精華區間
    const playlistTrackData = trackIds.map((trackId, index) => {
      const inputTrack = tracks[index];
      const startTime = inputTrack.startTime !== undefined && inputTrack.startTime !== null ? Number(inputTrack.startTime) : 0;
      const endTime = inputTrack.endTime !== undefined && inputTrack.endTime !== null ? Number(inputTrack.endTime) : 30;

      return {
        playlistId: playlist!.id,
        trackId: trackId,
        order: index + 1,
        startTime,
        endTime,
      };
    });

    await prisma.playlistTrack.createMany({
      data: playlistTrackData,
    });

    return NextResponse.json({
      message: "Sync successful",
      playlistId: playlist.id,
      syncedTracksCount: trackIds.length,
    });
  } catch (error) {
    console.error("[Spotify Sync Error]:", error);
    return NextResponse.json(
      { error: "Failed to sync tracks to database" },
      { status: 500 }
    );
  }
}
