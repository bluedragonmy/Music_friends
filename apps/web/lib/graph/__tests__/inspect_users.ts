import { PrismaClient } from "../../../app/generated/prisma-new";

const prisma = new PrismaClient();

async function main() {
  console.log("=== 查詢資料庫中的註冊用戶與聆聽歷史 ===");
  const users = await prisma.user.findMany({
    include: {
      playlists: {
        include: {
          tracks: {
            include: { track: true }
          }
        }
      },
      syncLogs: {
        include: { track: true }
      }
    }
  });

  console.log(`找到 ${users.length} 位用戶：`);
  for (const user of users) {
    console.log(`\n👤 用戶: ${user.name} (${user.email})`);
    
    // 歌單歌曲
    const playlists = user.playlists || [];
    console.log(`  歌單列表:`);
    playlists.forEach(pl => {
      console.log(`    - 歌單名稱: "${pl.name}" (${pl.tracks.length} 首):`);
      pl.tracks.slice(0, 10).forEach(pt => {
        console.log(`      * [${pt.track.artist}] ${pt.track.title} (${pt.track.album})`);
      });
      if (pl.tracks.length > 10) console.log(`      * ... 還有 ${pl.tracks.length - 10} 首`);
    });

    // 同步歷史
    const syncLogs = user.syncLogs || [];
    console.log(`  最近聆聽歷史 (${syncLogs.length} 首):`);
    syncLogs.slice(0, 10).forEach(log => {
      console.log(`    - [${log.track.artist}] ${log.track.title} (${log.track.album})`);
    });
    if (syncLogs.length > 10) console.log(`    ... 還有 ${syncLogs.length - 10} 首`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
