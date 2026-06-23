import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "找不到使用者" }, { status: 404 });
    }

    // 刪除舊的歌單
    await prisma.playlist.deleteMany({
      where: { userId: user.id },
    });

    // 從資料庫撈取已存在的所有真實歌曲（先前 seed 100 用戶時寫入的熱門歌曲）
    const existingTracks = await prisma.track.findMany({
      where: {
        spotifyId: { not: "4Tz5a8n2G3P1rUa6v0vN9b" },
      },
      take: 100,
    });

    let selectedTracks: { id: string }[] = [];

    if (existingTracks.length >= 5) {
      // 隨機選出 5 首歌 (使用穩定的隨機打亂)
      const shuffled = [...existingTracks]
        .map((t) => ({ t, rand: Math.random() }))
        .sort((a, b) => a.rand - b.rand)
        .map((x) => x.t);
      selectedTracks = shuffled.slice(0, 5).map((t) => ({ id: t.id }));
    } else {
      // 降級方案：如果資料庫裡沒有其他歌，就新增一首預設測試歌
      const mockSpotifyId = "4Tz5a8n2G3P1rUa6v0vN9b";
      const track = await prisma.track.upsert({
        where: { spotifyId: mockSpotifyId },
        update: {},
        create: {
          spotifyId: mockSpotifyId,
          title: "測試歌曲 1",
          artist: "測試歌手",
          coverImg: "https://i.scdn.co/image/ab67616d0000b273d9194aa18fa4c9362b47464f",
          duration: 0,
          url: "",
        },
      });
      selectedTracks = [{ id: track.id }];
    }

    // 建立一個包含這 5 首歌的測試歌單
    await prisma.playlist.create({
      data: {
        userId: user.id,
        name: "我的測試音樂人格",
        tracks: {
          create: selectedTracks.map((t, idx) => ({
            order: idx,
            trackId: t.id,
          })),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Inject mock playlist error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
