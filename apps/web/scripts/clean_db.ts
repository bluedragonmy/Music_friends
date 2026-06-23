import { PrismaClient } from "../app/generated/prisma";
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 === 正在暴力清空資料庫配對與滑卡紀錄 ===\n");

  const deletedMessages = await prisma.message.deleteMany({});
  console.log(`🗑️ 已刪除 ${deletedMessages.count} 筆 Message 歷史訊息。`);

  const deletedRooms = await prisma.matchRoom.deleteMany({});
  console.log(`🗑️ 已刪除 ${deletedRooms.count} 筆 MatchRoom 配對房間。`);

  const deletedSwipes = await prisma.userSwipe.deleteMany({});
  console.log(`🗑️ 已刪除 ${deletedSwipes.count} 筆 UserSwipe 滑動紀錄。`);

  console.log("\n✨ 資料庫配對狀態已完全回歸初始白紙！");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
