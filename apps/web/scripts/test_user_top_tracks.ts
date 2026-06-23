/**
 * apps/web/scripts/test_user_top_tracks.ts
 * 讀取使用者真實的 Top 5 歌曲，檢查 preview_url 是否為 null/undefined
 * 執行方式：npx tsx scripts/test_user_top_tracks.ts
 */

import { PrismaClient } from "../app/generated/prisma";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

async function main() {
  const account = await prisma.account.findFirst({
    where: {
      provider: "spotify",
      access_token: { not: null }
    },
    include: { user: true }
  });

  if (!account || !account.access_token) {
    console.error("❌ 找不到 Token");
    return;
  }

  console.log(`👤 讀取使用者: ${account.user.email}`);

  const res = await fetch("https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5", {
    headers: {
      Authorization: `Bearer ${account.access_token}`
    }
  });

  const data = await res.json();
  if (!data.items) {
    console.log("❌ 找不到 items", data);
    return;
  }

  for (const item of data.items) {
    console.log(`🎵 [${item.name} - ${item.artists.map((a: any) => a.name).join(", ")}]`);
    console.log(`   - preview_url: ${item.preview_url}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
