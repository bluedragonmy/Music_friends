/**
 * server/socket.ts
 * WebSocket {網頁通訊協定} 即時聊天室伺服器 (Socket.io)
 * 負責處理：即時訊息、48小時倒數、同步聆聽廣播、雙盲結算
 * 執行指令：npx tsx server/socket.ts
 */

import { createServer } from "http";
import { Server } from "socket.io";
import { prisma } from "../lib/prisma";
import { MatchStatus } from "../app/generated/prisma";

const PORT = 3002;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://127.0.0.1:3001";
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: [FRONTEND_URL],
    methods: ["GET", "POST"],
  },
});

console.log("⚡ WebSocket Server {即時伺服器} 正在初始化...");

// ── 連線處理機制 ──────────────────────────────────────────────────────────
io.on("connection", async (socket) => {
  const { userId, roomId } = socket.handshake.query as { userId?: string; roomId?: string };

  if (!userId || !roomId) {
    console.log("❌ 連線遭拒：缺少 userId 或 roomId");
    socket.disconnect(true);
    return;
  }

  try {
    // 1. 查詢房間狀態與權限驗證
    const room = await prisma.matchRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      console.log(`❌ 連線遭拒：找不到房間 ${roomId}`);
      socket.disconnect(true);
      return;
    }

    // 驗證連線者是否為房間內成員
    if (room.user1Id !== userId && room.user2Id !== userId) {
      console.log(`❌ 連線遭拒：使用者 ${userId} 不屬於房間 ${roomId}`);
      socket.disconnect(true);
      return;
    }

    // 2. 加入 Socket Room {房間群組}
    socket.join(roomId);
    console.log(`👤 使用者 ${userId} 已連線至房間 ${roomId}`);

    // 3. 廣播使用者上線通知
    socket.to(roomId).emit("user_connected", { userId });

    // 4. 定期檢查倒數計時與過期狀態
    const sendTimeStatus = () => {
      const now = new Date();
      const timeLeftSec = Math.max(0, Math.floor((room.expiresAt.getTime() - now.getTime()) / 1000));
      const isExpired = timeLeftSec <= 0;

      socket.emit("countdown_tick", {
        timeLeftSec,
        isExpired,
        status: room.status,
      });

      // 如果時間已到且房間狀態仍為 ACTIVE，將房間鎖定為 CLOSED
      if (isExpired && room.status === MatchStatus.ACTIVE) {
        prisma.matchRoom.update({
          where: { id: roomId },
          data: { status: MatchStatus.CLOSED },
        }).then((updatedRoom) => {
          io.to(roomId).emit("room_status_changed", { status: updatedRoom.status });
        }).catch(err => console.error("❌ 更新過期狀態失敗:", err));
      }
    };

    // 立即傳送一次時間狀態，並定時傳送
    sendTimeStatus();
    const ticker = setInterval(sendTimeStatus, 5000);

    // ── 事件 A：即時訊息傳遞 ──────────────────────────────────────────────
    socket.on("send_message", async ({ content }: { content: string }) => {
      try {
        const freshRoom = await prisma.matchRoom.findUnique({
          where: { id: roomId },
        });

        if (!freshRoom) {
          socket.emit("error_msg", { message: "房間不存在" });
          return;
        }

        // 時間已過期或狀態不為 ACTIVE 時限制發送 (唯讀模式)
        const isExpired = freshRoom.expiresAt.getTime() <= Date.now();
        if (isExpired || freshRoom.status === MatchStatus.CLOSED) {
          socket.emit("error_msg", { message: "🔒 聊天室已過期，轉為唯讀模式" });
          return;
        }

        // 將訊息存入資料庫
        const message = await prisma.message.create({
          data: {
            roomId,
            senderId: userId,
            content,
          },
          include: {
            sender: {
              select: { name: true, image: true },
            },
          },
        });

        // 廣播給房間內所有人（含發送者）
        io.to(roomId).emit("receive_message", message);
      } catch (err) {
        console.error("❌ 發送訊息失敗:", err);
        socket.emit("error_msg", { message: "無法發送訊息" });
      }
    });

    // ── 事件 B：同步聆聽廣播 ──────────────────────────────────────────────
    socket.on("sync_play_invite", ({ trackId, title, artist, coverImg, previewUrl }: {
      trackId: string;
      title: string;
      artist: string;
      coverImg: string | null;
      previewUrl: string | null;
    }) => {
      console.log(`🎵 使用者 ${userId} 發送同步播放邀請: ${title} - ${artist}`);
      // 廣播給房間內其他人
      socket.to(roomId).emit("sync_play_invite", {
        senderId: userId,
        trackId,
        title,
        artist,
        coverImg,
        previewUrl,
      });
    });

    // ── 事件 C：雙盲結算投票 ──────────────────────────────────────────────
    socket.on("submit_blind_choice", async ({ choice }: { choice: "KEEP" | "END" }) => {
      try {
        if (choice !== "KEEP" && choice !== "END") {
          socket.emit("error_msg", { message: "無效的選擇，僅限 KEEP 或 END" });
          return;
        }

        const freshRoom = await prisma.matchRoom.findUnique({
          where: { id: roomId },
        });

        if (!freshRoom) {
          socket.emit("error_msg", { message: "房間不存在" });
          return;
        }

        // 只有已過期或處於 ACTIVE 狀態才能結算
        if (freshRoom.status === MatchStatus.MATCHED) {
          socket.emit("error_msg", { message: "雙方已確定保留關係" });
          return;
        }

        const isUser1 = freshRoom.user1Id === userId;
        const updateData = isUser1 ? { user1Choice: choice } : { user2Choice: choice };

        const updatedRoom = await prisma.matchRoom.update({
          where: { id: roomId },
          data: updateData,
        });

        console.log(`🗳️ 使用者 ${userId} 提交雙盲選擇: ${choice}`);

        const u1Choice = updatedRoom.user1Choice;
        const u2Choice = updatedRoom.user2Choice;

        // 檢查是否雙方皆已投票
        if (u1Choice && u2Choice) {
          let finalStatus: MatchStatus = MatchStatus.CLOSED;

          if (u1Choice === "KEEP" && u2Choice === "KEEP") {
            finalStatus = MatchStatus.MATCHED; // 雙方皆保留 -> 升級為好友！
          }

          const resolvedRoom = await prisma.matchRoom.update({
            where: { id: roomId },
            data: { status: finalStatus },
          });

          console.log(`🏁 雙盲選擇結算完成：狀態變更為 ${finalStatus}`);

          io.to(roomId).emit("blind_choice_resolved", {
            status: resolvedRoom.status,
            user1Choice: resolvedRoom.user1Choice,
            user2Choice: resolvedRoom.user2Choice,
          });
        } else {
          // 僅一人投票時，只通知「有人已完成投票」，保持雙盲神秘感
          io.to(roomId).emit("blind_choice_submitted", {
            submittedUserId: userId,
          });
        }
      } catch (err) {
        console.error("❌ 雙盲投票處理失敗:", err);
        socket.emit("error_msg", { message: "無法提交雙盲選擇" });
      }
    });

    // 斷線清理
    socket.on("disconnect", () => {
      console.log(`🔌 使用者 ${userId} 已從房間 ${roomId} 斷開連線`);
      clearInterval(ticker);
    });

  } catch (error) {
    console.error("❌ 連線異常處理:", error);
    socket.disconnect(true);
  }
});

// 啟動伺服器
httpServer.listen(PORT, () => {
  console.log(`🚀 WebSocket Server {即時伺服器} 正在監聽 port ${PORT}`);
});
