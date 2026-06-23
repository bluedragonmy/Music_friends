import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!me) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { targetUserId, action } = body;

    if (!targetUserId || !["LIKE", "SKIP"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid payload: targetUserId and action (LIKE|SKIP) required" },
        { status: 400 }
      );
    }

    // 確認目標使用者存在
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // 1. 寫入/更新滑動紀錄
    await prisma.userSwipe.upsert({
      where: {
        swiperId_targetId: {
          swiperId: me.id,
          targetId: targetUserId,
        },
      },
      update: { action },
      create: {
        swiperId: me.id,
        targetId: targetUserId,
        action,
      },
    });

    // 2. 狀態機判定：只有 LIKE 才需要檢查是否互相喜歡
    if (action === "LIKE") {
      const theirSwipe = await prisma.userSwipe.findUnique({
        where: {
          swiperId_targetId: {
            swiperId: targetUserId,
            targetId: me.id,
          },
        },
      });

      // ✅ 雙向 LIKE → 建立 MatchRoom！
      if (theirSwipe?.action === "LIKE") {
        // 利用雙方 ID 排序產生固定且唯一的 roomId，利用 DB 的 Primary Key 限制來防止 Race Condition
        const [u1, u2] = me.id < targetUserId ? [me.id, targetUserId] : [targetUserId, me.id];
        const deterministicRoomId = `match_${u1}_${u2}`;

        try {
          // 嘗試直接建立房間。如果對方剛好也在同一毫秒建立，資料庫 PK 會擋下其中一個 (Prisma 拋出 P2002)
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

          // 通知對方有新配對
          if (target.email) {
            const targetChannel = `user-${target.email.replace(/@/g, "-").replace(/\./g, "-")}`;
            const { pusherServer } = await import("@/lib/pusher");
            await pusherServer.trigger(targetChannel, "new_match", {
              roomId: room.id,
            });
          }

          return NextResponse.json({
            isMatch: true,
            roomId: room.id,
            expiresAt: room.expiresAt,
          });
        } catch (error: any) {
          // P2002: Unique constraint failed on the fields: (`id`)
          // 代表對方剛好在同一時間建立成功了，我們直接讀取那個房間即可
          if (error.code === "P2002") {
            const existingRoom = await prisma.matchRoom.findUnique({
              where: { id: deterministicRoomId },
            });
            
            return NextResponse.json({
              isMatch: true,
              roomId: existingRoom?.id,
              expiresAt: existingRoom?.expiresAt,
            });
          }
          throw error; // 其他未知錯誤往上拋
        }
      }
    }

    // SKIP 或對方尚未 LIKE
    return NextResponse.json({ isMatch: false });
  } catch (error) {
    console.error("[Match Action Error]:", error);
    return NextResponse.json(
      { error: "Failed to process swipe action" },
      { status: 500 }
    );
  }
}
