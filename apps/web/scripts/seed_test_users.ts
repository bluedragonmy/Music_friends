/**
 * seed_test_users.ts
 * 塞入假用戶資料，並透過 Spotify Search API 將歌曲資訊與真實的 Spotify Track ID (及封面等) 自動關聯。
 * 執行方式：npx tsx scripts/seed_test_users.ts
 */

import { PrismaClient } from "../app/generated/prisma";
import dotenv from "dotenv";
import path from "path";
import { fetchFallbackPreviewUrl } from "../lib/audio";

// 載入 .env 設定
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();


// ── 假用戶資料設定 ──────────────────────────────────────────────────────
const TEST_USERS = [
  {
    name: "測試用戶 A（高度相似）",
    email: "test_a@example.com",
    bio: "喜歡周杰倫和五月天的樂迷",
    tracks: [
      { title: "七里香", artist: "周杰倫", album: "七里香" },
      { title: "稻香", artist: "周杰倫", album: "魔杰座" },
      { title: "突然好想你", artist: "五月天", album: "後青春期的詩" },
      { title: "傷心的人別聽慢歌", artist: "五月天", album: "為愛而生" },
      { title: "普通朋友", artist: "陶喆", album: "I'm OK" },
    ],
  },
  {
    name: "測試用戶 B（中度相似）",
    email: "test_b@example.com",
    bio: "獨立音樂愛好者",
    tracks: [
      { title: "不能說的秘密", artist: "周杰倫", album: "不能說的秘密" },
      { title: "Daydreaming", artist: "Radiohead", album: "A Moon Shaped Pool" },
      { title: "Shape of You", artist: "Ed Sheeran", album: "÷" },
      { title: "Blinding Lights", artist: "The Weeknd", album: "After Hours" },
      { title: "Bad Guy", artist: "Billie Eilish", album: "WHEN WE ALL FALL ASLEEP" },
    ],
  },
  {
    name: "測試用戶 C（低度相似）",
    email: "test_c@example.com",
    bio: "歐美流行樂迷",
    tracks: [
      { title: "Flowers", artist: "Miley Cyrus", album: "Endless Summer Vacation" },
      { title: "As It Was", artist: "Harry Styles", album: "Harry's House" },
      { title: "Anti-Hero", artist: "Taylor Swift", album: "Midnights" },
      { title: "Unholy", artist: "Sam Smith", album: "Gloria" },
      { title: "Calm Down", artist: "Rema", album: "Calm Down" },
    ],
  },
  {
    name: "測試用戶 D（完全不相似）",
    email: "test_d@example.com",
    bio: "爵士與古典樂迷",
    tracks: [
      { title: "Autumn Leaves", artist: "Miles Davis", album: "Portrait in Jazz" },
      { title: "So What", artist: "Miles Davis", album: "Kind of Blue" },
      { title: "Moonlight Sonata", artist: "Beethoven", album: "Classical Essentials" },
      { title: "Take Five", artist: "Dave Brubeck", album: "Time Out" },
      { title: "Blue in Green", artist: "Bill Evans", album: "Kind of Blue" },
    ],
  },
  {
    name: "測試用戶 E（五月天愛好者）",
    email: "test_e@example.com",
    bio: "五月天死忠粉",
    tracks: [
      { title: "乾杯", artist: "五月天", album: "第二人生" },
      { title: "知足", artist: "五月天", album: "知足" },
      { title: "頑固", artist: "五月天", album: "自傳" },
      { title: "聽不到", artist: "梁靜茹", album: "燕子" },
      { title: "我不願讓你一個人", artist: "五月天", album: "第二人生" },
    ],
  },
];

// 1. 取得 Spotify Client Credentials Access Token
async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn("⚠️ .env 中缺少 Spotify Client ID/Secret，無法動態關聯真實 ID。");
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
    console.error("❌ 獲取 Spotify Token 失敗:", error);
    return null;
  }
}

// 2. 搜尋真實歌曲的 ID 與 Metadata
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
    console.error(`❌ 搜尋歌曲 [${title} - ${artist}] 失敗:`, error);
    return null;
  }
}

async function main() {
  console.log("🌱 開始向 Spotify 搜尋並灌入真實的歌曲種子資料...\n");

  const spotifyToken = await getSpotifyAccessToken();
  if (!spotifyToken) {
    console.error("❌ 無法取得 Spotify Token，終止執行。請確認 .env 中的 Spotify 金鑰配置。");
    return;
  }

  for (const userData of TEST_USERS) {
    // 1. 建立或更新假用戶
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

    // 2. 建立/更新歌曲 (使用真實的 Spotify ID)
    const trackIds: string[] = [];
    for (let i = 0; i < userData.tracks.length; i++) {
      const t = userData.tracks[i];
      const spotifyInfo = await searchRealSpotifyTrack(spotifyToken, t.title, t.artist);

      if (!spotifyInfo) {
        console.warn(`   ⚠️ 找不到歌曲: ${t.title} - ${t.artist}，跳過。`);
        continue;
      }

      let previewUrl = spotifyInfo.previewUrl;
      if (!previewUrl) {
        previewUrl = await fetchFallbackPreviewUrl(t.title, t.artist);
      }

      // 用真實的 Spotify ID 作為唯一鍵值，並儲存播放連結（Web Playback SDK 可播放 spotify:track:[spotifyId]）
      const track = await prisma.track.upsert({
        where: { spotifyId: spotifyInfo.spotifyId },
        update: {
          title: t.title,
          artist: t.artist,
          album: t.album,
          url: `spotify:track:${spotifyInfo.spotifyId}`, // 這裡儲存 Web Playback SDK 標準的 URI
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

      console.log(`   🎵 [${track.title} - ${track.artist}] -> 🟢 真實 Spotify ID: ${track.spotifyId}`);
      trackIds.push(track.id);
    }

    // 3. 建立或更新歌單
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

    console.log(`   📂 歌單「${playlist.name}」建立完成，共關聯 ${trackIds.length} 首真實歌曲。\n`);
  }

  console.log("🎉 測試用戶種子資料全面升級為真實 Spotify ID！資料同步完畢。");
}

main()
  .catch((e) => {
    console.error("❌ 錯誤：", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
