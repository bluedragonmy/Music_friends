import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/match/is-test-user?userId=xxx
 * 查詢目標用戶是否為測試假用戶（沒有任何 OAuth 帳號綁定）
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const accountCount = await prisma.account.count({
    where: { userId },
  });

  return NextResponse.json({ isTestUser: accountCount === 0 });
}
