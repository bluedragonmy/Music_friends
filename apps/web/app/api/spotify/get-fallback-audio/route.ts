import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchFallbackPreviewUrl } from "@/lib/audio";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title");
    const artist = searchParams.get("artist");
    const spotifyId = searchParams.get("spotifyId");
    const force = searchParams.get("force") === "true";

    if (!title) {
      return NextResponse.json({ error: "Missing title parameter" }, { status: 400 });
    }

    // 1. 若有 spotifyId 且非強行重抓，先試著從資料庫獲取快取
    if (spotifyId && !force) {
      const dbTrack = await prisma.track.findUnique({
        where: { spotifyId },
        select: { previewUrl: true }
      });
      if (dbTrack?.previewUrl) {
        return NextResponse.json({ previewUrl: dbTrack.previewUrl });
      }
    }

    // 2. 資料庫無快取，進行動態爬取/搜尋
    const queryArtist = artist || "";
    const previewUrl = await fetchFallbackPreviewUrl(title, queryArtist);

    // 3. 異步寫回資料庫作為快取，不阻塞當前請求
    if (spotifyId && previewUrl) {
      prisma.track.update({
        where: { spotifyId },
        data: { previewUrl }
      }).catch(err => {
        console.error(`[Fallback API Cache Update Failed] ${spotifyId}:`, err);
      });
    }

    return NextResponse.json({ previewUrl });
  } catch (error: any) {
    console.error("[Get Fallback Audio Route Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
