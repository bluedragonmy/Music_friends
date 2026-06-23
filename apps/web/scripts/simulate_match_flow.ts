/**
 * simulate_match_flow.ts
 * 自動建立兩個測試使用者，並在資料庫層級模擬他們互相喜歡 (Swipe KEEP)、
 * 配對成功 (MatchRoom)、以及在聊天室互傳訊息的完整流程。
 * 執行方式：npx tsx scripts/simulate_match_flow.ts
 */

import { PrismaClient } from "../app/generated/prisma";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient();

async function main() {
  console.log("🤖 開始自動模擬配對流程...");

  const userAEmail = "sim_a@vibe.local";
  const userBEmail = "sim_b@vibe.local";

  // 1. 建立或重置 User A 與 User B
  console.log("👤 正在準備 User A 與 User B...");
  const userA = await prisma.user.upsert({
    where: { email: userAEmail },
    update: { name: "Alice (Sim A)", image: "https://api.dicebear.com/7.x/notionists/svg?seed=Alice&backgroundColor=ffdfbf" },
    create: { email: userAEmail, name: "Alice (Sim A)", image: "https://api.dicebear.com/7.x/notionists/svg?seed=Alice&backgroundColor=ffdfbf", bio: "我是 User A，喜歡聽流行音樂！" },
  });

  const userB = await prisma.user.upsert({
    where: { email: userBEmail },
    update: { name: "Bob (Sim B)", image: "https://api.dicebear.com/7.x/notionists/svg?seed=Bob&backgroundColor=b6e3f4" },
    create: { email: userBEmail, name: "Bob (Sim B)", image: "https://api.dicebear.com/7.x/notionists/svg?seed=Bob&backgroundColor=b6e3f4", bio: "我是 User B，熱愛搖滾樂！" },
  });

  // 分配歌曲給 User A 和 User B 避免他們被判定為未完成 onboarding
  console.log("💿 為 User A 與 User B 分配歌曲...");
  const availableTracks = await prisma.track.findMany({ take: 20 });
  if (availableTracks.length >= 5) {
    for (const user of [userA, userB]) {
      let playlist = await prisma.playlist.findFirst({ where: { userId: user.id } });
      if (!playlist) {
        playlist = await prisma.playlist.create({ data: { userId: user.id, name: "模擬歌單" } });
      }
      await prisma.playlistTrack.deleteMany({ where: { playlistId: playlist.id } });
      const shuffled = [...availableTracks].sort(() => Math.random() - 0.5).slice(0, 5);
      await prisma.playlistTrack.createMany({
        data: shuffled.map((track, idx) => ({
          playlistId: playlist!.id,
          trackId: track.id,
          order: idx + 1,
        }))
      });
    }
  }

  // 為了乾淨測試，清除他們之前的配對和訊息紀錄
  await prisma.message.deleteMany({
    where: { OR: [{ senderId: userA.id }, { senderId: userB.id }] }
  });
  await prisma.matchRoom.deleteMany({
    where: { OR: [{ user1Id: userA.id, user2Id: userB.id }, { user1Id: userB.id, user2Id: userA.id }] }
  });
  await prisma.userSwipe.deleteMany({
    where: { OR: [{ swiperId: userA.id, targetId: userB.id }, { swiperId: userB.id, targetId: userA.id }] }
  });

  // 2. 模擬互相喜歡 (Swipes)
  console.log("💞 模擬互相喜歡 (A likes B, B likes A)...");
  await prisma.userSwipe.createMany({
    data: [
      { swiperId: userA.id, targetId: userB.id, action: "LIKE" },
      { swiperId: userB.id, targetId: userA.id, action: "LIKE" },
    ]
  });

  // 3. 建立 MatchRoom
  console.log("🏠 建立聊天室...");
  // 設定到期時間為 24 小時後
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const matchRoom = await prisma.matchRoom.create({
    data: {
      user1Id: userA.id,
      user2Id: userB.id,
      status: "ACTIVE",
      expiresAt,
    }
  });

  // 4. 模擬對話
  console.log("💬 模擬互相發送訊息...");
  await prisma.message.create({
    data: {
      roomId: matchRoom.id,
      senderId: userA.id,
      content: "哈囉 Bob！我看到你的歌單了，品味真不錯！🎵",
    }
  });

  // 模擬時間差
  await new Promise(res => setTimeout(res, 1000));

  await prisma.message.create({
    data: {
      roomId: matchRoom.id,
      senderId: userB.id,
      content: "嗨 Alice！謝謝妳，我也覺得我們的音樂共鳴度很高 😎",
    }
  });

  // 5. 模擬雙盲選擇 (Blind Choice) - 雙方都選擇 KEEP，狀態轉 MATCHED
  console.log("✨ 模擬雙方選擇保留對話 (Blind Choice: KEEP)...");
  await prisma.matchRoom.update({
    where: { id: matchRoom.id },
    data: { 
      user1Choice: "KEEP",
      user2Choice: "KEEP",
      status: "MATCHED" 
    }
  });

  console.log(`\n🎉 模擬配對與聊天完成！`);
  console.log(`您可以開啟無痕視窗分別登入以下帳號測試：`);
  console.log(`👉 帳號 A: ${userAEmail}`);
  console.log(`👉 帳號 B: ${userBEmail}`);
}

main()
  .catch((e) => {
    console.error("❌ 發生錯誤：", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
