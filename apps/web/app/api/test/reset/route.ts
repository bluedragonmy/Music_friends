/**
 * app/api/test/reset/route.ts
 * 測試專用：一鍵徹底重設全資料庫所有的配對聊天室、歷史訊息與滑動紀錄，確保開發測試環境乾淨純潔
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
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

    // 1. 刪除全資料庫所有訊息
    await prisma.message.deleteMany({});

    // 2. 刪除全資料庫所有配對房間
    await prisma.matchRoom.deleteMany({});

    // 3. 刪除全資料庫所有滑動紀錄
    await prisma.userSwipe.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "Successfully reset all match rooms, messages, and swipes across the entire database for a clean test environment.",
    });
  } catch (error) {
    console.error("[Reset Test Data Error]:", error);
    return NextResponse.json(
      { error: "Failed to reset test data" },
      { status: 500 }
    );
  }
}

