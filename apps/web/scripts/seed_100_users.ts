/**
 * seed_100_users.ts
 * 塞入 100 名測試用戶資料，並透過 Spotify 官方「全球前 50 大熱門歌曲」歌單
 * 獲取真實音樂資料，隨機分配給這些測試用戶。
 * 執行方式：npx tsx scripts/seed_100_users.ts
 */

import { PrismaClient } from "../app/generated/prisma";
import dotenv from "dotenv";
import path from "path";

// 載入 .env 設定
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

// Spotify 全球前 50 名播放清單 ID
const TOP_50_PLAYLIST_ID = "37i9dQZEVXbMDoHDwVN2tF";

// 1. 取得 Spotify Client Credentials Access Token
async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn("⚠️ .env 中缺少 Spotify Client ID/Secret，無法獲取 Spotify API。");
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

// 2. 獲取 Spotify 熱門歌曲 (透過 Search API 避免 Playlist API 的 403 權限問題)
async function searchPopularSpotifyTracks(token: string): Promise<any[]> {
  try {
    const genres = ["lofi", "jazz", "acoustic", "pop", "kpop", "rock"];
    let allTracks: any[] = [];
    
    // 為了保證能聽到「真正的該首歌曲」，當 Spotify 不給 preview_url 時，我們呼叫 iTunes API 當作完美備案！
    async function getItunesPreview(title: string, artist: string): Promise<string | null> {
      try {
        const query = encodeURIComponent(`${title} ${artist}`);
        const res = await fetch(`https://itunes.apple.com/search?term=${query}&limit=1&entity=song`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            return data.results[0].previewUrl || null;
          }
        }
      } catch (e) {
        console.error("iTunes API fallback failed for", title);
      }
      return null;
    }

    for (const genre of genres) {
      const query = encodeURIComponent(genre);
      const res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const tracksRaw = (data.tracks?.items || []).filter((t: any) => t && t.id);
        
        for (const t of tracksRaw) {
          let preview = t.preview_url;
          // 若 Spotify 沒有提供試聽，即時去 iTunes 抓真正的歌曲試聽！
          if (!preview) {
            preview = await getItunesPreview(t.name, t.artists[0]?.name || "");
          }
          
          if (preview) {
            allTracks.push({
              spotifyId: t.id,
              title: t.name,
              artist: t.artists.map((a: any) => a.name).join(", "),
              album: t.album.name,
              coverImg: t.album.images?.[0]?.url || null,
              duration: Math.floor(t.duration_ms / 1000),
              url: t.external_urls?.spotify || `spotify:track:${t.id}`,
              previewUrl: preview,
            });
          }
        }
      }
    }
    
    // 去除重複的歌曲
    const uniqueTracks = Array.from(new Map(allTracks.map(t => [t.spotifyId, t])).values());
    return uniqueTracks;
  } catch (error) {
    console.error("❌ 搜尋 Spotify 歌曲失敗:", error);
    return [];
  }
}

// 輔助函式：打亂陣列順序 (Fisher-Yates Shuffle)
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// 輔助函式：產生隨機名字
function generateRandomName() {
  const adjectives = ["快樂的", "神秘的", "酷炫的", "憂鬱的", "活潑的", "安靜的", "熱情的", "浪漫的"];
  const nouns = ["貓咪", "狗狗", "旅人", "音樂家", "詩人", "星空", "海洋", "微風", "吉他手", "靈魂"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}`;
}

// 輔助函式：產生隨機頭像網址 (使用 Google 的開源頭像產生器)
function generateRandomAvatar(seed: string) {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

async function main() {
  console.log("🌱 開始建立 100 名擁有真實 Spotify 音樂的測試者...");

  const spotifyToken = await getSpotifyAccessToken();
  if (!spotifyToken) {
    console.error("❌ 缺少 Spotify Token，無法繼續。");
    return;
  }

  console.log("📥 正在從 Spotify 搜尋熱門流行歌曲...");
  const realTracks = await searchPopularSpotifyTracks(spotifyToken);
  
  if (realTracks.length === 0) {
    console.error("❌ 獲取歌曲失敗，無法繼續。");
    return;
  }
  
  console.log(`✅ 成功獲取 ${realTracks.length} 首真實歌曲！`);

  // 先將這些真實歌曲同步到我們的資料庫
  const savedTrackIds: string[] = [];
  for (const trackData of realTracks) {
    const track = await prisma.track.upsert({
      where: { spotifyId: trackData.spotifyId },
      update: trackData,
      create: trackData,
    });
    savedTrackIds.push(track.id);
  }
  console.log(`💾 已將 ${savedTrackIds.length} 首歌曲儲存至資料庫。`);

  // 開始產生 100 名用戶
  console.log("👥 開始建立 100 名測試使用者...");
  
  for (let i = 1; i <= 100; i++) {
    const email = `testuser_${i}@vibe.local`;
    const name = generateRandomName();
    const avatar = generateRandomAvatar(email);
    
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, image: avatar },
      create: { email, name, image: avatar, bio: "我是一個由程式自動產生的熱愛音樂的測試員！" },
    });

    // 隨機從歌曲庫挑選 5 首歌
    const shuffledTrackIds = shuffleArray(savedTrackIds);
    const selectedTrackIds = shuffledTrackIds.slice(0, 5);

    // 建立或更新這名用戶的歌單
    let playlist = await prisma.playlist.findFirst({
      where: { userId: user.id, name: "我的最愛音樂" },
    });

    if (!playlist) {
      playlist = await prisma.playlist.create({
        data: {
          userId: user.id,
          name: "我的最愛音樂",
          description: "這是我隨機挑選的 5 首歌！",
        },
      });
    }

    // 清空舊歌單關聯，並寫入新的 5 首歌
    await prisma.playlistTrack.deleteMany({ where: { playlistId: playlist.id } });
    await prisma.playlistTrack.createMany({
      data: selectedTrackIds.map((trackId, idx) => ({
        playlistId: playlist!.id,
        trackId,
        order: idx + 1,
      })),
    });

    // 每建立 10 個顯示一次進度
    if (i % 10 === 0) {
      console.log(`⏳ 已建立 ${i} / 100 名使用者...`);
    }
  }

  console.log("\n🎉 大功告成！100 名真實測試使用者已產生完畢！");
}

main()
  .catch((e) => {
    console.error("❌ 發生錯誤：", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
