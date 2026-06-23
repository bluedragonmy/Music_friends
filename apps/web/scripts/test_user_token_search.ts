/**
 * apps/web/scripts/test_user_token_search.ts
 * 讀取資料庫中的 User OAuth Token 進行搜尋，驗證 preview_url 是否正常回傳
 * 執行方式：npx tsx scripts/test_user_token_search.ts
 */

import { PrismaClient } from "../app/generated/prisma";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

async function main() {
  // 1. 從資料庫撈取擁有有效 Spotify Token 的 Account
  const account = await prisma.account.findFirst({
    where: {
      provider: "spotify",
      access_token: { not: null }
    },
    include: { user: true }
  });

  if (!account || !account.access_token) {
    console.error("❌ 找不到資料庫中綁定 Spotify 的使用者 OAuth Token，請先在瀏覽器以 Spotify 登入！");
    return;
  }

  console.log(`👤 成功讀取使用者：${account.user.email} 的 Spotify 權限 Token！`);
  console.log(`🔑 Token 前綴: ${account.access_token.substring(0, 15)}...\n`);

  const title = "突然好想你";
  const artist = "五月天";

  console.log(`🔎 使用 User OAuth Token 搜尋歌曲 [${title} - ${artist}]...`);
  const query = encodeURIComponent(`track:${title} artist:${artist}`);
  const res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
    headers: {
      Authorization: `Bearer ${account.access_token}`
    }
  });

  const data = await res.json();
  const track = data.tracks?.items?.[0];

  if (!track) {
    console.log("❌ 找不到歌曲");
    return;
  }

  console.log("🌟 Spotify API 回傳物件特徵：");
  console.log(`- 歌名: ${track.name}`);
  console.log(`- 歌手: ${track.artists.map((a: any) => a.name).join(", ")}`);
  console.log(`- 預覽連結 (preview_url): ${track.preview_url}`);
  console.log(`- 是否有試聽: ${track.preview_url ? "🟢 有" : "🔴 沒有 (Spotify 可能在此地區下架了預覽音檔)"}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
