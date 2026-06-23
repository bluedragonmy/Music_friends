import { PrismaClient } from "../app/generated/prisma-new";

const prisma = new PrismaClient();

const FALLBACK_PREVIEW_POOL = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
];

// 根據文字生成固定 Fallback 預覽網址
function getFallbackPreviewUrl(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_PREVIEW_POOL[Math.abs(hash) % FALLBACK_PREVIEW_POOL.length];
}

async function getValidAccessToken(account: any) {
  const now = Math.floor(Date.now() / 1000);
  if (account.expires_at && account.expires_at > now + 300) {
    return account.access_token;
  }
  if (!account.refresh_token) {
    throw new Error(`無 refresh token`);
  }
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });
  if (!response.ok) {
    throw new Error(`刷新 Token 失敗: ${await response.text()}`);
  }
  const data = await response.json();
  const newExpiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      expires_at: newExpiresAt,
      ...(data.refresh_token && { refresh_token: data.refresh_token }),
    },
  });
  return data.access_token;
}

async function main() {
  console.log("🛠️ 開始全面掃描資料庫中缺少「試聽預覽網址 (previewUrl)」的歌曲...");

  const incompleteTracks = await prisma.track.findMany({
    where: { previewUrl: null }
  });

  if (incompleteTracks.length === 0) {
    console.log("✅ 所有歌曲皆已具有 previewUrl！");
    return;
  }

  console.log(`🔍 發現共有 ${incompleteTracks.length} 首歌曲缺乏 previewUrl。`);

  // 取得 Spotify Token
  const account = await prisma.account.findFirst({
    where: { provider: "spotify" }
  });

  let accessToken: string | null = null;
  if (account) {
    try {
      accessToken = await getValidAccessToken(account);
    } catch (e) {
      console.log("⚠️ 無法獲取 Spotify Token，將直接使用固定雜湊模擬試聽連結填滿欄位...");
    }
  }

  const spotifyTracksToQuery = incompleteTracks.filter(t => t.spotifyId);
  const spotifyIdToPreviewMap = new Map<string, string | null>();

  if (accessToken && spotifyTracksToQuery.length > 0) {
    console.log(`🎸 正在嘗試批次向 Spotify 查詢 ${spotifyTracksToQuery.length} 首歌曲的真實試聽連結...`);
    
    // Spotify Get Tracks API 限制一次最多 50 首
    const chunkSize = 50;
    for (let i = 0; i < spotifyTracksToQuery.length; i += chunkSize) {
      const chunk = spotifyTracksToQuery.slice(i, i + chunkSize);
      const idsParam = chunk.map(t => t.spotifyId).join(",");
      
      try {
        const res = await fetch(`https://api.spotify.com/v1/tracks?ids=${idsParam}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.tracks) {
            for (const sTrack of data.tracks) {
              if (sTrack && sTrack.id) {
                spotifyIdToPreviewMap.set(sTrack.id, sTrack.preview_url || null);
              }
            }
          }
        } else {
          console.log(`⚠️ Spotify API 查詢失敗 (${res.status})，後續將為此區段使用模擬 Fallback 連結。`);
        }
      } catch (err) {
        console.error("批次查詢 Spotify Track 失敗:", err);
      }
    }
  }

  let fixCount = 0;
  for (const track of incompleteTracks) {
    let previewUrl = track.spotifyId ? spotifyIdToPreviewMap.get(track.spotifyId) : null;
    
    // 如果 Spotify API 沒查到、回傳 null，或是不支援，就使用和諧的 Fallback MP3 音樂池連結
    if (!previewUrl) {
      previewUrl = getFallbackPreviewUrl(track.title || track.id);
    }

    await prisma.track.update({
      where: { id: track.id },
      data: { previewUrl }
    });

    fixCount++;
    if (fixCount % 20 === 0 || fixCount === incompleteTracks.length) {
      console.log(`⚡ 已修復 ${fixCount} / ${incompleteTracks.length} 首歌曲...`);
    }
  }

  console.log(`\n🎉 大功告成！成功一鍵修復並補滿了 ${fixCount} 首歌曲的 previewUrl 數據。`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
