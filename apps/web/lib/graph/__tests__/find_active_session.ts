import { PrismaClient } from "../../../app/generated/prisma-new";

const prisma = new PrismaClient();

async function main() {
  console.log("=== 正在檢索最近有活動的真實 Spotify 綁定帳戶 ===");
  
  // 1. 查詢所有 Account
  const accounts = await prisma.account.findMany({
    include: {
      user: true
    }
  });

  console.log(`\n1. 資料庫中共有 ${accounts.length} 個綁定 Account：`);
  accounts.forEach(acc => {
    console.log(`   - Provider: ${acc.provider} | Provider ID: ${acc.providerAccountId} | 關聯 User Email: ${acc.user?.email} (${acc.user?.name})`);
  });

  // 2. 查詢所有 User
  const users = await prisma.user.findMany({
    include: {
      playlists: true,
      syncLogs: true
    }
  });

  console.log(`\n2. 所有非模擬的註冊 User 列表 (email 不含 vibe.local)：`);
  users.filter(u => u.email && !u.email.endsWith("@vibe.local") && !u.email.endsWith("@example.com")).forEach(u => {
    console.log(`   - User: ${u.name} | Email: ${u.email} | Playlists: ${u.playlists.length} | SyncLogs: ${u.syncLogs.length}`);
    if (u.syncLogs.length > 0) {
      console.log(`     * 最近一次同步記錄數: ${u.syncLogs.length}`);
    }
  });

  // 3. 查詢最近產生的 SyncLogs
  const recentLogs = await prisma.syncLog.findMany({
    take: 10,
    include: {
      user: true,
      track: true
    }
  });

  console.log(`\n3. 最近 10 筆同步的 SyncLogs 歷史：`);
  if (recentLogs.length === 0) {
    console.log("   (目前無任何 SyncLog 記錄)");
  } else {
    recentLogs.forEach((log: any) => {
      console.log(`   - [${log.createdAt?.toLocaleString() || log.playedAt?.toLocaleString()}] User: ${log.user?.email} | Track: [${log.track?.artist || log.trackId}] ${log.track?.title || ""}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
