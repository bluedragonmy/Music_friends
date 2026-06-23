import { prisma } from "../lib/prisma";

async function testRaceCondition() {
  console.log("🚀 開始測試同時互相 LIKE 的 Race Condition (Bug 3)...\n");

  // 1. 建立兩個測試用的使用者
  const userA = await prisma.user.create({
    data: { name: "TestUserA_Race", email: `testA_${Date.now()}@example.com`, username: `testA_${Date.now()}` },
  });
  const userB = await prisma.user.create({
    data: { name: "TestUserB_Race", email: `testB_${Date.now()}@example.com`, username: `testB_${Date.now()}` },
  });

  console.log(`✅ 建立兩個使用者: ${userA.id} 與 ${userB.id}`);

  // 決定唯一的 roomId (照我們剛剛寫好的字母順序邏輯)
  const [u1, u2] = userA.id < userB.id ? [userA.id, userB.id] : [userB.id, userA.id];
  const deterministicRoomId = `match_${u1}_${u2}`;
  
  console.log(`🔒 預期的唯一 Room ID: ${deterministicRoomId}\n`);

  // 2. 模擬後端 API 的核心邏輯：雙方同時嘗試建立房間 (這就是 Race Condition 的瞬間)
  const createRoomLogic = async (actor: string) => {
    try {
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 小時後
      const room = await prisma.matchRoom.create({
        data: {
          id: deterministicRoomId,
          user1Id: u1,
          user2Id: u2,
          status: "ACTIVE",
          expiresAt,
        },
      });
      console.log(`🟢 [${actor}] 建立房間成功！(Room ID: ${room.id})`);
      return room;
    } catch (error: any) {
      if (error.code === "P2002") {
        console.log(`🟡 [${actor}] 建立失敗，觸發 P2002 (Primary Key 衝突)！對方已經先搶到了。讀取現有房間...`);
        const existingRoom = await prisma.matchRoom.findUnique({
          where: { id: deterministicRoomId },
        });
        return existingRoom;
      }
      throw error;
    }
  };

  // 3. 使用 Promise.all() 在完全相同的「毫秒」內發送兩個請求
  console.log("⚡ 準備同時發射兩個建立房間的請求...");
  const results = await Promise.all([
    createRoomLogic("UserA 執行緒"),
    createRoomLogic("UserB 執行緒"),
  ]);

  console.log("\n📊 最終測試結果:");
  console.log(`👉 UserA 拿到的 RoomID: ${results[0]?.id}`);
  console.log(`👉 UserB 拿到的 RoomID: ${results[1]?.id}`);
  
  if (results[0]?.id === results[1]?.id && results[0]?.id === deterministicRoomId) {
    console.log("\n🎉 測試通過！兩個人同時拿到同一個房間，沒有產生重複聊天室！");
  } else {
    console.log("\n❌ 測試失敗，產生了異常結果。");
  }

  // 4. 檢查資料庫實際上到底有幾個房間
  const roomsInDb = await prisma.matchRoom.findMany({
    where: { id: deterministicRoomId }
  });
  console.log(`\n📂 資料庫中實際符合該 ID 的房間數量: ${roomsInDb.length} (預期為 1)`);

  // 清理測試資料
  await prisma.user.deleteMany({
    where: { id: { in: [userA.id, userB.id] } }
  });
  console.log("🧹 測試資料已清理完畢。");
}

testRaceCondition()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
