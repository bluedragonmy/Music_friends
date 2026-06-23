/**
 * 批次重新同步腳本：對所有有 Spotify 帳號的使用者
 * 直接呼叫 Spotify API 重抓 top tracks，並以「Spotify previewUrl 優先，網易雲補充」的正確邏輯存入 DB
 */
import { PrismaClient } from "../app/generated/prisma-new";

const prisma = new PrismaClient();

async function fetchFallbackPreviewUrl(title: string, artist: string): Promise<string | null> {
  const query = `${title} ${artist}`;
  try {
    const searchUrl = `https://music.163.com/api/search/get/web?s=${encodeURIComponent(query)}&type=1&limit=1`;
    const res = await fetch(searchUrl);
    if (res.ok) {
      const searchData = await res.json();
      const song = searchData?.result?.songs?.[0];
      if (song && song.id) {
        return `https://music.163.com/song/media/outer/url?id=${song.id}.mp3`;
      }
    }
  } catch (err) {
    console.error(`[Fallback] NetEase search failed for "${query}":`, err);
  }
  return null;
}

async function syncUserTracks(userId: string, email: string, accessToken: string) {
  // 1. 拉取 Spotify top tracks
  const spotifyRes = await fetch(
    "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (spotifyRes.status === 401) {
    console.log(`  ⚠️  Token expired for ${email}, skipping.`);
    return;
  }
  if (!spotifyRes.ok) {
    console.log(`  ❌  Spotify API error ${spotifyRes.status} for ${email}, skipping.`);
    return;
  }

  const spotifyData = await spotifyRes.json();
  const rawTracks = spotifyData.items || [];

  if (rawTracks.length === 0) {
    console.log(`  ⚠️  No top tracks found for ${email}.`);
    return;
  }

  // 2. 逐首處理 previewUrl
  const trackIds: string[] = [];
  for (const item of rawTracks) {
    const title = item.name;
    const artist = item.artists.map((a: any) => a.name).join(", ");
    const spotifyPreviewUrl: string | null = item.preview_url;

    let finalPreviewUrl: string | null = spotifyPreviewUrl;

    if (!finalPreviewUrl) {
      console.log(`    → Spotify previewUrl is null for "${title}", fetching from NetEase...`);
      finalPreviewUrl = await fetchFallbackPreviewUrl(title, artist);
    }

    console.log(`    [${finalPreviewUrl ? "✅" : "❌"}] ${title} | previewUrl: ${finalPreviewUrl?.substring(0, 60) ?? "null"}`);

    // 3. upsert 入 DB
    const track = await prisma.track.upsert({
      where: { spotifyId: item.id },
      update: {
        title,
        artist,
        album: item.album.name,
        coverImg: item.album.images[0]?.url || null,
        duration: Math.floor(item.duration_ms / 1000),
        url: finalPreviewUrl || "",
        previewUrl: finalPreviewUrl || null,
      },
      create: {
        spotifyId: item.id,
        title,
        artist,
        album: item.album.name,
        coverImg: item.album.images[0]?.url || null,
        duration: Math.floor(item.duration_ms / 1000),
        url: finalPreviewUrl || "",
        previewUrl: finalPreviewUrl || null,
      },
    });
    trackIds.push(track.id);
  }

  // 4. 更新 Playlist
  let playlist = await prisma.playlist.findFirst({
    where: { userId, name: "My Spotify Top Tracks" },
  });

  if (!playlist) {
    playlist = await prisma.playlist.create({
      data: {
        userId,
        name: "My Spotify Top Tracks",
        description: "Auto-synced from Spotify",
        coverImg: rawTracks[0]?.album?.images[0]?.url || null,
      },
    });
  }

  await prisma.playlistTrack.deleteMany({ where: { playlistId: playlist.id } });

  await prisma.playlistTrack.createMany({
    data: trackIds.map((trackId, index) => ({
      playlistId: playlist!.id,
      trackId,
      order: index + 1,
      startTime: 0,
      endTime: 30,
    })),
  });

  console.log(`  ✅ Synced ${trackIds.length} tracks for ${email}`);
}

async function main() {
  console.log("🚀 Starting batch re-sync for all Spotify-linked users...\n");

  const accounts = await prisma.account.findMany({
    where: { provider: "spotify" },
    include: { user: true },
  });

  console.log(`Found ${accounts.length} Spotify-linked account(s).\n`);

  for (const account of accounts) {
    const email = account.user.email || "(no email)";
    console.log(`📦 Processing user: ${account.user.name || email} (${email})`);

    if (!account.access_token) {
      console.log("  ⚠️  No access_token, skipping.\n");
      continue;
    }

    try {
      await syncUserTracks(account.userId, email, account.access_token);
    } catch (err: any) {
      console.error(`  ❌ Error syncing ${email}:`, err.message);
    }
    console.log("");
  }

  console.log("🎉 Batch re-sync complete!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
