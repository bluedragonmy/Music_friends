/**
 * 修復腳本：清除資料庫中所有被錯誤存入的網易雲直鏈
 * 這些連結是之前因為 sync 邏輯錯誤，強制用網易雲覆蓋了 Spotify 原生 previewUrl 所留下的
 * 清除後，使用者下次在歌單編輯頁同步，就會重新以正確邏輯（優先 Spotify）寫入乾淨的 previewUrl
 */
import { PrismaClient } from "../app/generated/prisma-new";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Scanning DB for tracks with NetEase Cloud previewUrls...");

  const neteaseCount = await prisma.track.count({
    where: {
      previewUrl: { contains: "163.com" }
    }
  });

  const soundhelixCount = await prisma.track.count({
    where: {
      previewUrl: { contains: "soundhelix.com" }
    }
  });

  console.log(`Found ${neteaseCount} track(s) with NetEase (163.com) previewUrl`);
  console.log(`Found ${soundhelixCount} track(s) with SoundHelix fallback previewUrl`);

  // 清空被錯誤填入的網易雲直鏈（改回 null），讓下次同步時正確處理
  const result = await prisma.track.updateMany({
    where: {
      previewUrl: { contains: "163.com" }
    },
    data: {
      previewUrl: null,
      url: ""
    }
  });

  console.log(`\n✅ Cleared ${result.count} NetEase previewUrl(s) from DB.`);
  console.log("👉 Users should now re-sync their playlists from the playlist edit page.");
  console.log("   The sync will now correctly use Spotify's own previewUrl first.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
