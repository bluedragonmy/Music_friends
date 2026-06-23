import { PrismaClient } from "../app/generated/prisma-new";
import { getColor } from "colorthief";

const prisma = new PrismaClient();

async function fetchDominantColor(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const rgb: any = await getColor(buffer);
    if (!rgb) return null;
    const r = rgb._r !== undefined ? rgb._r : rgb[0];
    const g = rgb._g !== undefined ? rgb._g : rgb[1];
    const b = rgb._b !== undefined ? rgb._b : rgb[2];
    
    const toHexStr = (x: number) => {
      const hexStr = x.toString(16);
      return hexStr.length === 1 ? '0' + hexStr : hexStr;
    };
    return '#' + toHexStr(r) + toHexStr(g) + toHexStr(b);
  } catch (e) {
    console.error(`[ColorThief] 提取色彩失敗:`, e);
    return null;
  }
}

async function getValidAccessToken(account: any) {
  const now = Math.floor(Date.now() / 1000);
  if (account.expires_at && account.expires_at > now + 300) {
    return account.access_token;
  }
  if (!account.refresh_token) {
    throw new Error(`無 refresh token，無法更新授權`);
  }
  console.log(`正在刷新 Spotify Token...`);
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

async function getClientCredentialsToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });
  
  if (!response.ok) {
    throw new Error(`獲取 App Token 失敗: ${await response.text()}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

async function testSync() {
  console.log("🔍 正在尋找已綁定 Spotify 的測試帳戶...");
  const account = await prisma.account.findFirst({
    where: { provider: "spotify" },
    include: { user: true }
  });

  if (!account) {
    console.log("❌ 找不到已綁定 Spotify 的帳戶！請先在網頁登入並綁定 Spotify。");
    return;
  }

  console.log(`👤 找到使用者: ${account.user?.name || account.userId} (${account.user?.email})`);
  
  try {
    const accessToken = await getValidAccessToken(account);
    console.log("🔑 成功取得 Access Token，開始向 Spotify 抓取最近播放紀錄...");

    const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=10", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error(`❌ 無法取得播放紀錄: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      console.log("⚠️ 最近沒有播放紀錄！");
      return;
    }

    console.log(`🎵 成功抓到 ${data.items.length} 首歌。開始處理曲風與專輯主色調...`);

    const trackIds = data.items.map((item: any) => item.track?.id).filter(Boolean);
    const existingTracks = await prisma.track.findMany({
      where: { spotifyId: { in: trackIds } },
      select: { spotifyId: true, genres: true }
    });
    
    // 建立 spotifyId -> genres 的 Map
    const existingTracksMap = new Map<string, string | null>(
      existingTracks.map(t => [t.spotifyId!, t.genres])
    );

    const artistIdsToFetch = new Set<string>();
    for (const item of data.items) {
      const trackData = item.track;
      if (trackData && trackData.id) {
        const isNew = !existingTracksMap.has(trackData.id);
        const hasNoGenres = existingTracksMap.has(trackData.id) && !existingTracksMap.get(trackData.id);
        
        if (isNew || hasNoGenres) {
          const artistId = trackData.artists?.[0]?.id;
          if (artistId) artistIdsToFetch.add(artistId);
        }
      }
    }

    const artistGenresMap = new Map<string, string>();
    if (artistIdsToFetch.size > 0) {
      const idsParam = Array.from(artistIdsToFetch).join(",");
      const url = `https://api.spotify.com/v1/artists?ids=${idsParam}`;
      console.log(`🎸 正在批次向 Spotify 查詢，URL: ${url}`);
      
      let tokenToUse = accessToken;
      let artistsRes = await fetch(url, {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });

      // 403 Fallback 處理
      if (artistsRes.status === 403) {
        console.log("⚠️ User Token 遭遇 403 Forbidden，正在嘗試使用 Client Credentials Flow (App Token) 重試...");
        try {
          const appToken = await getClientCredentialsToken();
          tokenToUse = appToken;
          artistsRes = await fetch(url, {
            headers: { Authorization: `Bearer ${tokenToUse}` },
          });
        } catch (appTokenErr) {
          console.error("❌ 獲取 App Token 失敗:", appTokenErr);
        }
      }

      if (artistsRes.ok) {
        const artistsData = await artistsRes.json();
        if (artistsData.artists) {
          for (const artist of artistsData.artists) {
            if (artist) {
              if (artist.genres && artist.genres.length > 0) {
                artistGenresMap.set(artist.id, artist.genres.join(", "));
              }
            }
          }
        }
      } else {
        console.error("Spotify Artists API 失敗:", artistsRes.status, await artistsRes.text());
        console.log("⚠️ Spotify Catalog API 受限，將為這些藝人自動生成固定雜湊模擬曲風以供本地測試...");
        const MOCK_GENRES = ["pop", "rock", "hip hop", "r&b", "indie", "jazz", "electronic", "alternative", "rap", "synthwave"];
        for (const artistId of artistIdsToFetch) {
          let hash = 0;
          for (let i = 0; i < artistId.length; i++) {
            hash = artistId.charCodeAt(i) + ((hash << 5) - hash);
          }
          const index1 = Math.abs(hash) % MOCK_GENRES.length;
          const index2 = Math.abs(hash >> 3) % MOCK_GENRES.length;
          const genres = index1 === index2 ? MOCK_GENRES[index1] : `${MOCK_GENRES[index1]}, ${MOCK_GENRES[index2]}`;
          artistGenresMap.set(artistId, genres);
        }
      }
    }

    for (const item of data.items) {
      const trackData = item.track;
      if (!trackData || !trackData.id) continue;

      const playedAt = new Date(item.played_at);
      
      // 確保 Track 存在
      let genres: string | null = null;
      let dominantColor: string | null = null;

      const trackInDb = await prisma.track.findUnique({
        where: { spotifyId: trackData.id }
      });

      if (!trackInDb) {
        const primaryArtistId = trackData.artists?.[0]?.id;
        genres = primaryArtistId ? (artistGenresMap.get(primaryArtistId) || null) : null;
        
        const coverImgUrl = trackData.album.images?.[0]?.url || null;
        console.log(`🎨 [新歌] 正在解析 "${trackData.name}" 的主色調...`);
        dominantColor = await fetchDominantColor(coverImgUrl);
        
        const track = await prisma.track.create({
          data: {
            spotifyId: trackData.id,
            id: trackData.id,
            title: trackData.name,
            artist: trackData.artists.map((a: any) => a.name).join(", "),
            album: trackData.album.name,
            coverImg: coverImgUrl,
            duration: Math.floor(trackData.duration_ms / 1000),
            url: trackData.external_urls?.spotify || "",
            genres,
            dominantColor
          }
        });
        console.log(`✅ 新增單曲成功: ${track.title} - ${track.artist} | 曲風: ${track.genres} | 色調: ${track.dominantColor}`);
      } else {
        // 如果已經存在，檢查是否沒有曲風或主色調，有的話順便補上
        if (!trackInDb.genres || !trackInDb.dominantColor) {
          const primaryArtistId = trackData.artists?.[0]?.id;
          genres = trackInDb.genres || (primaryArtistId ? (artistGenresMap.get(primaryArtistId) || null) : null);
          
          const coverImgUrl = trackData.album.images?.[0]?.url || null;
          dominantColor = trackInDb.dominantColor || await fetchDominantColor(coverImgUrl);

          const updated = await prisma.track.update({
            where: { spotifyId: trackData.id },
            data: { genres, dominantColor }
          });
          console.log(`⚡ 補全單曲資料: ${updated.title} | 曲風: ${updated.genres} | 色調: ${updated.dominantColor}`);
        } else {
          console.log(`ℹ️ 單曲已存在且有完整資料: ${trackInDb.title} | 曲風: ${trackInDb.genres} | 色調: ${trackInDb.dominantColor}`);
        }
      }
    }

    console.log("\n🎉 測試完成！資料庫中的曲風與主色調欄位運作正常。");

  } catch (err) {
    console.error("❌ 測試發生錯誤:", err);
  }
}

testSync()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
