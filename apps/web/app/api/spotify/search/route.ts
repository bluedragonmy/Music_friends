import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        accounts: {
          where: { provider: "spotify" }
        }
      }
    });

    if (!user || user.accounts.length === 0) {
      return NextResponse.json({ error: "Spotify account not linked" }, { status: 401 });
    }

    const account = user.accounts[0];
    if (!account.access_token) {
      return NextResponse.json({ error: "Spotify access token missing" }, { status: 401 });
    }

    // 1. Search Spotify
    const spotifyRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
      {
        headers: { Authorization: `Bearer ${account.access_token}` },
      }
    );

    if (spotifyRes.status === 401) {
      return NextResponse.json({ error: "Spotify token expired" }, { status: 401 });
    }

    if (!spotifyRes.ok) {
      throw new Error("Spotify API failed");
    }

    const spotifyData = await spotifyRes.json();
    const tracksRaw = (spotifyData.tracks?.items || []).filter((t: any) => t && t.id);

    // 2. Format tracks and apply iTunes fallback
    const formattedTracks = await Promise.all(
      tracksRaw.map(async (t: any) => {
        let previewUrl = t.preview_url;
        
        // If Spotify doesn't provide previewUrl, use iTunes
        if (!previewUrl) {
          try {
            const artistName = t.artists[0]?.name || "";
            const itunesQuery = encodeURIComponent(`${t.name} ${artistName}`);
            const itunesRes = await fetch(`https://itunes.apple.com/search?term=${itunesQuery}&limit=1&entity=song`);
            if (itunesRes.ok) {
              const itunesData = await itunesRes.json();
              if (itunesData.results && itunesData.results.length > 0) {
                previewUrl = itunesData.results[0].previewUrl || null;
              }
            }
          } catch (err) {
            console.error("iTunes fallback failed for", t.name);
          }
        }

        return {
          spotifyId: t.id,
          title: t.name,
          artist: t.artists.map((a: any) => a.name).join(", "),
          album: t.album.name,
          coverImg: t.album.images?.[0]?.url || null,
          duration: Math.floor(t.duration_ms / 1000),
          url: t.external_urls?.spotify || `spotify:track:${t.id}`,
          previewUrl: previewUrl || null,
        };
      })
    );

    return NextResponse.json(formattedTracks);
  } catch (error) {
    console.error("[Spotify Search Error]:", error);
    return NextResponse.json({ error: "Failed to search tracks" }, { status: 500 });
  }
}
