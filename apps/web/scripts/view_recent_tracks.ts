import { PrismaClient } from "../app/generated/prisma-new";

const prisma = new PrismaClient();

async function main() {
  console.log("📊 === 正在從 Database {資料庫} 讀取最新同步歌曲數據 ===\n");
  
  const tracks = await prisma.track.findMany({
    take: 10,
    where: {
      OR: [
        { genres: { not: null } },
        { dominantColor: { not: null } }
      ]
    }
  });

  if (tracks.length === 0) {
    console.log("❌ 目前資料庫中還沒有包含曲風或主色調的歌曲，請先執行同步測試。");
    return;
  }

  console.table(
    tracks.map(t => ({
      "Song Title {歌名}": t.title.substring(0, 25),
      "Artist {藝人}": t.artist.substring(0, 20),
      "Genres {曲風}": t.genres || "無",
      "Dominant Color {主色調}": t.dominantColor || "無",
      "Preview URL {試聽連結}": t.previewUrl ? t.previewUrl.substring(0, 35) + "..." : "無"
    }))
  );
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
