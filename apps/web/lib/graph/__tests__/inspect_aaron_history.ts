import { PrismaClient } from "../../../app/generated/prisma-new";

const prisma = new PrismaClient();

async function main() {
  const email = "aaronlee0715@gmail.com";
  console.log(`=== 正在提取真實登入用戶 ${email} 的聆聽數據 ===`);

  const user = await prisma.user.findUnique({
    where: { email },
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

  if (!user) {
    console.error(`❌ 找不到用戶 ${email}`);
    return;
  }

  // 1. 整理播放列表歌曲
  console.log("\n--- 歌單歌曲樣品 (前 15 首) ---");
  const playlistTracks = user.playlists?.[0]?.tracks || [];
  playlistTracks.slice(0, 15).forEach((pt, idx) => {
    console.log(`   ${idx + 1}. [${pt.track.artist}] ${pt.track.title} (Album: ${pt.track.album})`);
  });

  // 2. 統計全部歌曲中的熱門歌手
  const artistCounts: Record<string, number> = {};
  const songSample: Record<string, string[]> = {};

  // 合併歌單與同步歷史中出現的歌手
  const allTracks = [
    ...playlistTracks.map(pt => pt.track),
    ...(user.syncLogs || []).map(sl => sl.track)
  ];

  allTracks.forEach(track => {
    if (!track) return;
    const artists = track.artist.split(",").map(a => a.trim());
    artists.forEach(artist => {
      artistCounts[artist] = (artistCounts[artist] || 0) + 1;
      if (!songSample[artist]) {
        songSample[artist] = [];
      }
      if (!songSample[artist].includes(track.title)) {
        songSample[artist].push(track.title);
      }
    });
  });

  // 排序熱門歌手
  const sortedArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  console.log(`\n--- 熱門歌手排行榜 (Top 30) ---`);
  sortedArtists.forEach(([artist, count], idx) => {
    const samples = songSample[artist].slice(0, 3).join(", ");
    console.log(`   ${idx + 1}. ${artist}: 出現 ${count} 次 | 範例曲目: [${samples}]`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
