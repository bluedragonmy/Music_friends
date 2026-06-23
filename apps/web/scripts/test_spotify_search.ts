/**
 * apps/web/scripts/test_spotify_search.ts
 * 測試 Spotify 搜尋並列印詳細 API 回傳結構，排查 preview_url 為 null 的問題
 * 執行方式：npx tsx scripts/test_spotify_search.ts
 */

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });
  
  const data = await res.json();
  return data.access_token;
}

async function testSearch() {
  const token = await getSpotifyAccessToken();
  if (!token) {
    console.error("Token is null");
    return;
  }
  
  // 測試搜尋 Miley Cyrus 的 Flowers (歐美流行歌通常必有 preview_url)
  // 同時加入 market=TW 測試是否有差別
  const queries = [
    { title: "Flowers", artist: "Miley Cyrus" },
    { title: "七里香", artist: "周杰倫" },
    { title: "突然好想你", artist: "五月天" }
  ];
  
  for (const q of queries) {
    console.log(`\n🔎 正在搜尋：${q.title} - ${q.artist}...`);
    // 試試不加 market
    const query = encodeURIComponent(`track:${q.title} artist:${q.artist}`);
    const resNoMarket = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const dataNoMarket = await resNoMarket.json();
    const trackNoMarket = dataNoMarket.tracks?.items?.[0];
    
    // 試試加上 market=TW
    const resWithMarket = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1&market=TW`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const dataWithMarket = await resWithMarket.json();
    const trackWithMarket = dataWithMarket.tracks?.items?.[0];
    
    console.log(`❌ 無指定 Market 回傳:`);
    console.log(JSON.stringify(trackNoMarket, null, 2));
    
    console.log(`🇹🇼 指定 market=TW 回傳:`);
    console.log(JSON.stringify(trackWithMarket, null, 2));
  }
}

testSearch();
