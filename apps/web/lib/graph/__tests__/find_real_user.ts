import { PrismaClient } from "../../../app/generated/prisma-new";

const prisma = new PrismaClient();

async function main() {
  console.log("=== 正在尋找最新登入的真實 Spotify 用戶 ===");
  const users = await prisma.user.findMany({
    where: {
      NOT: [
        { email: { endsWith: "@vibe.local" } },
        { email: { endsWith: "@example.com" } },
        { email: { endsWith: "@music.com" } },
        { email: { endsWith: "demo@vibe.com" } },
        { email: { endsWith: "test@vibe.com" } }
      ]
    },
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

  console.log(`共找到 ${users.length} 個真實用戶：`);
  for (const user of users) {
    console.log(`\n👤 真實用戶: ${user.name} (${user.email})`);
    
    // 歌單歌曲
    const playlists = user.playlists || [];
    playlists.forEach(pl => {
      console.log(`  歌單: "${pl.name}" (${pl.tracks.length} 首):`);
      pl.tracks.forEach(pt => {
        console.log(`    - [${pt.track.artist}] ${pt.track.title} (Album: ${pt.track.album})`);
      });
    });

    // 同步歷史
    const syncLogs = user.syncLogs || [];
    console.log(`  同步歷史 (${syncLogs.length} 首):`);
    syncLogs.forEach(log => {
      console.log(`    - [${log.track.artist}] ${log.track.title}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
