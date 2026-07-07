/**
 * seed_test_users.ts
 * 塞入五種不同音樂人格的用戶資料。
 * 執行方式：npx tsx scripts/seed_test_users.ts
 */

import { PrismaClient } from "../app/generated/prisma-new";
import dotenv from "dotenv";
import path from "path";
import { fetchFallbackPreviewUrl } from "../lib/audio";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const prisma = new PrismaClient();

// ── 五種不同音樂人格用戶資料設定 ───────────────────────────────────────
const TEST_USERS = [
  {
    name: "User A (Hip-Hop 樂迷)",
    email: "test_a@example.com",
    bio: "只聽美國嘻哈與饒舌音樂",
    tracks: [
      { title: "Sicko Mode", artist: "Travis Scott", album: "Astroworld" },
      { title: "Humble", artist: "Kendrick Lamar", album: "DAMN." },
      { title: "God's Plan", artist: "Drake", album: "Scorpion" },
    ],
  },
  {
    name: "User B (K-pop 追星族)",
    email: "test_b@example.com",
    bio: "熱愛新世代 K-pop 女團，特別是 NewJeans",
    tracks: [
      { title: "Attention", artist: "NewJeans", album: "New Jeans" },
      { title: "Hype Boy", artist: "NewJeans", album: "New Jeans" },
      { title: "Ditto", artist: "NewJeans", album: "OMG" },
    ],
  },
  {
    name: "User C (幕後製作人 Nerd)",
    email: "test_c@example.com",
    bio: "買唱片一定會看 Credits，超迷 250 與 Jack Antonoff",
    tracks: [
      { title: "Attention", artist: "NewJeans", album: "New Jeans" },
      { title: "Melodrama", artist: "Lorde", album: "Melodrama" },
      { title: "1989", artist: "Taylor Swift", album: "1989" },
    ],
  },
  {
    name: "User D (Only Taylor Swift 粉絲)",
    email: "test_d@example.com",
    bio: "Swiftie，除了 Taylor Swift 之外什麼都不聽",
    tracks: [
      { title: "Anti-Hero", artist: "Taylor Swift", album: "Midnights" },
      { title: "Blank Space", artist: "Taylor Swift", album: "1989" },
      { title: "Cruel Summer", artist: "Taylor Swift", album: "Lover" },
    ],
  },
  {
    name: "User E (純粹 Jazz 聽眾)",
    email: "test_e@example.com",
    bio: "只沉浸在經典爵士與小號的世界中",
    tracks: [
      { title: "So What", artist: "Miles Davis", album: "Kind of Blue" },
      { title: "Autumn Leaves", artist: "Miles Davis", album: "Portrait in Jazz" },
      { title: "Take Five", artist: "Dave Brubeck", album: "Time Out" },
    ],
  },
];

async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn("⚠️ .env 中缺少 Spotify Client ID/Secret，將採用 Fallback 虛擬種子數據填充。");
    return null;
  }

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.access_token;
  } catch (error) {
    console.error("❌ 獲取 Spotify Token 失敗，改用 Fallback 虛擬種子數據填充:", error);
    return null;
  }
}

async function searchRealSpotifyTrack(
  token: string,
  title: string,
  artist: string
): Promise<{ spotifyId: string; coverImg: string | null; duration: number; previewUrl: string | null } | null> {
  try {
    const query = encodeURIComponent(`track:${title} artist:${artist}`);
    const res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const track = data.tracks?.items?.[0];
    if (!track) return null;

    return {
      spotifyId: track.id,
      coverImg: track.album?.images?.[0]?.url || null,
      duration: Math.floor(track.duration_ms / 1000),
      previewUrl: track.preview_url || null,
    };
  } catch (error) {
    return null;
  }
}

async function main() {
  console.log("🌱 開始向 Spotify 搜尋並灌入歌曲種子資料...\n");

  const spotifyToken = await getSpotifyAccessToken();
  const hasToken = spotifyToken !== null;

  for (const userData of TEST_USERS) {
    // 1. 建立或更新用戶
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { name: userData.name, bio: userData.bio },
      create: {
        email: userData.email,
        name: userData.name,
        bio: userData.bio,
      },
    });
    console.log(`👤 用戶: ${user.name} (${user.id})`);

    // 2. 建立/更新歌曲
    const trackIds: string[] = [];
    for (let i = 0; i < userData.tracks.length; i++) {
      const t = userData.tracks[i];
      let spotifyInfo: { spotifyId: string; coverImg: string | null; duration: number; previewUrl: string | null } | null = null;

      if (hasToken && spotifyToken) {
        spotifyInfo = await searchRealSpotifyTrack(spotifyToken, t.title, t.artist);
      }

      // Fallback
      if (!spotifyInfo) {
        const mockId = `mock_${t.title.replace(/\s+/g, "_").toLowerCase()}_${t.artist.replace(/\s+/g, "_").toLowerCase()}`;
        spotifyInfo = {
          spotifyId: mockId,
          coverImg: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300",
          duration: 180,
          previewUrl: null,
        };
      }

      let previewUrl = spotifyInfo.previewUrl;
      if (!previewUrl && !previewUrl?.startsWith("mock")) {
        previewUrl = await fetchFallbackPreviewUrl(t.title, t.artist);
      }

      const track = await prisma.track.upsert({
        where: { spotifyId: spotifyInfo.spotifyId },
        update: {
          title: t.title,
          artist: t.artist,
          album: t.album,
          url: `spotify:track:${spotifyInfo.spotifyId}`,
          coverImg: spotifyInfo.coverImg,
          duration: spotifyInfo.duration,
          previewUrl,
        },
        create: {
          spotifyId: spotifyInfo.spotifyId,
          title: t.title,
          artist: t.artist,
          album: t.album,
          duration: spotifyInfo.duration,
          url: `spotify:track:${spotifyInfo.spotifyId}`,
          coverImg: spotifyInfo.coverImg,
          previewUrl,
        },
      });

      console.log(`   🎵 [${track.title} - ${track.artist}] -> 🟢 ID: ${track.spotifyId}`);
      trackIds.push(track.id);
    }

    // 3. 建立或更新歌單 "My Spotify Top Tracks"
    let playlist = await prisma.playlist.findFirst({
      where: { userId: user.id, name: "My Spotify Top Tracks" },
    });

    if (!playlist) {
      playlist = await prisma.playlist.create({
        data: {
          userId: user.id,
          name: "My Spotify Top Tracks",
          description: "測試用歌單",
        },
      });
    }

    // 4. 清空並重新關聯歌曲
    await prisma.playlistTrack.deleteMany({ where: { playlistId: playlist.id } });
    await prisma.playlistTrack.createMany({
      data: trackIds.map((trackId, idx) => ({
        playlistId: playlist!.id,
        trackId,
        order: idx + 1,
      })),
    });

    // 5. 順便為該用戶塞一些 SyncLog，用來多重驗證
    await prisma.syncLog.deleteMany({ where: { userId: user.id } });
    await prisma.syncLog.createMany({
      data: trackIds.map((trackId) => ({
        userId: user.id,
        trackId,
        playedAt: new Date(),
        listenDurationMs: 120000,
      })),
    });

    console.log(`   📂 歌單「${playlist.name}」與 SyncLogs 建立完成，共關聯 ${trackIds.length} 首歌曲。\n`);
  }

  console.log("🎉 測試用戶種子資料更新與同步完畢！");
}

main()
  .catch((e) => {
    console.error("❌ 錯誤：", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
