import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getValidSpotifyToken } from "@/lib/spotify-token";

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "5";

    // 自動刷新 Token（若已過期則透過 refresh_token 換新的再使用）
    const accessToken = await getValidSpotifyToken(user.id);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Spotify account not linked or token refresh failed. Please re-authenticate." },
        { status: 401 }
      );
    }

    // 呼叫 Spotify API 取得 Top Tracks
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Spotify API responded with status ${response.status}`);
    }

    const data = await response.json();

    // 整理成乾淨的格式回傳給前端
    const formattedTracks = data.items.map((item: any) => ({
      spotifyId: item.id,
      title: item.name,
      artist: item.artists.map((a: any) => a.name).join(", "),
      album: item.album.name,
      coverImg: item.album.images[0]?.url || null,
      duration: Math.floor(item.duration_ms / 1000),
      previewUrl: item.preview_url, // Spotify 原生 30 秒試聽片段（可能為 null）
    }));

    return NextResponse.json(formattedTracks);
  } catch (error) {
    console.error("[Spotify Top Tracks Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch Spotify top tracks" },
      { status: 500 }
    );
  }
}
