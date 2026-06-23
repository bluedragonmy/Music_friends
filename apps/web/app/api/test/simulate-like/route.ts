/**
 * app/api/test/simulate-like/route.ts
 * 測試專用：模擬指定候選人對我按下「LIKE」喜歡，以便雙向喜歡順利觸發聊天室
 */

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
    const { candidateId } = body;

    if (!candidateId) {
      return NextResponse.json({ error: "candidateId is required" }, { status: 400 });
    }

    // 模擬對方 (candidateId) 滑動我 (me.id) 且動作為 LIKE
    const swipe = await prisma.userSwipe.upsert({
      where: {
        swiperId_targetId: {
          swiperId: candidateId,
          targetId: me.id,
        },
      },
      update: { action: "LIKE" },
      create: {
        swiperId: candidateId,
        targetId: me.id,
        action: "LIKE",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully simulated candidate ${candidateId} liking you. Now like them back to match!`,
      swipe,
    });
  } catch (error) {
    console.error("[Simulate Like Error]:", error);
    return NextResponse.json(
      { error: "Failed to simulate like" },
      { status: 500 }
    );
  }
}
