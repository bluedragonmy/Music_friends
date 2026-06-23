/**
 * 完整修復腳本：
 * 1. 清除所有 SoundHelix 假資料
 * 2. 對兩個主要使用者用有效 token 重新從 Spotify 同步真實歌曲
 */
import { PrismaClient } from "../app/generated/prisma-new";

const prisma = new PrismaClient();

async function refreshSpotifyToken(accountId: string, refreshToken: string): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    console.log("  ❌ Token refresh failed:", data.error);
    return null;
  }

  const newExpiresAt = Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600);
  await prisma.account.update({
    where: { id: accountId },
    data: {
      access_token: data.access_token,
      expires_at: newExpiresAt,
      ...(data.refresh_token && { refresh_token: data.refresh_token }),
    },
  });
  console.log("  ✅ Token refreshed successfully");
  return data.access_token;
}

async function getValidToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "spotify" },
  });
  if (!account) return null;

  const isExpired = account.expires_at ? Date.now() >= (account.expires_at - 300) * 1000 : true;
  if (!isExpired && account.access_token) return account.access_token;

  if (account.refresh_token) {
    return refreshSpotifyToken(account.id, account.refresh_token);
  }
  return null;
}

async function syncUser(userId: string, email: string) {
  console.log(`\n📦 Syncing ${email}...`);

  const token = await getValidToken(userId);
  if (!token) {
    console.log("  ⚠️  Cannot get valid token, skipping");
    return;
  }

  const spotifyRes = await fetch(
    "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5",
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!spotifyRes.ok) {
    console.log(`  ❌ Spotify API error: ${spotifyRes.status}`);
    const errData = await spotifyRes.json();
    console.log("  Detail:", errData);
    return;
  }

  const spotifyData = await spotifyRes.json();
  const items = spotifyData.items || [];
  console.log(`  Found ${items.length} top tracks from Spotify`);

  const trackIds: string[] = [];
  for (const item of items) {
    const previewUrl: string | null = item.preview_url;
    let status = previewUrl ? `✅ ${previewUrl.substring(0, 60)}` : "⚠️  null (Spotify has no preview for this track)";
    console.log(`  [${trackIds.length + 1}] ${item.name} — ${status}`);

    const track = await prisma.track.upsert({
      where: { spotifyId: item.id },
      update: {
        title: item.name,
        artist: item.artists.map((a: any) => a.name).join(", "),
        album: item.album.name,
        coverImg: item.album.images[0]?.url || null,
        duration: Math.floor(item.duration_ms / 1000),
        url: previewUrl || "",
        previewUrl: previewUrl,
      },
      create: {
        spotifyId: item.id,
        title: item.name,
        artist: item.artists.map((a: any) => a.name).join(", "),
        album: item.album.name,
        coverImg: item.album.images[0]?.url || null,
        duration: Math.floor(item.duration_ms / 1000),
        url: previewUrl || "",
        previewUrl: previewUrl,
      },
    });
    trackIds.push(track.id);
  }

  // 更新 My Spotify Top Tracks 歌單
  let playlist = await prisma.playlist.findFirst({
    where: { userId, name: "My Spotify Top Tracks" },
  });
  if (!playlist) {
    playlist = await prisma.playlist.create({
      data: {
        userId,
        name: "My Spotify Top Tracks",
        description: "Auto-synced from Spotify",
        coverImg: items[0]?.album?.images[0]?.url || null,
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

  console.log(`  ✅ Synced ${trackIds.length} tracks`);
}

async function main() {
  // Step 1: 清除所有 SoundHelix 假資料
  console.log("🧹 Step 1: Clearing all SoundHelix fake previewUrls from DB...");
  const cleared = await prisma.track.updateMany({
    where: { previewUrl: { contains: "soundhelix.com" } },
    data: { previewUrl: null, url: "" },
  });
  console.log(`  Cleared ${cleared.count} SoundHelix tracks\n`);

  // Step 2: 重新同步兩個主要使用者
  console.log("🔄 Step 2: Re-syncing real Spotify top tracks for key users...");

  const targetEmails = ["aaronlee0715@gmail.com", "411121217@gms.ndhu.edu.tw"];
  for (const email of targetEmails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { console.log(`\n❌ ${email} not found`); continue; }
    await syncUser(user.id, email);
  }

  console.log("\n🎉 Done! Check the app now.");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
