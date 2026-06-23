import { PrismaClient } from "../app/generated/prisma";
const prisma = new PrismaClient();

async function main() {
  console.log("📊 === 資料庫現狀健康診斷 ===\n");

  const users = await prisma.user.findMany({
    include: {
      playlists: {
        include: {
          tracks: {
            include: { track: true }
          }
        }
      }
    }
  });

  console.log(`👥 目前資料庫共有 ${users.length} 位使用者：`);
  users.forEach(u => {
    console.log(`\n👤 使用者: ${u.name} (${u.email})`);
    console.log(`   ID: ${u.id}`);
    console.log(`   歌單數量: ${u.playlists.length}`);
    u.playlists.forEach(p => {
      console.log(`   🎵 歌單: "${p.name}" (ID: ${p.id})`);
      console.log(`      曲目數量: ${p.tracks.length}`);
      p.tracks.forEach(pt => {
        console.log(`      - [${pt.order}] ${pt.track.title} - ${pt.track.artist}`);
      });
    });
  });

  const rooms = await prisma.matchRoom.findMany();
  console.log(`\n💬 目前資料庫共有 ${rooms.length} 個配對聊天室。`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
