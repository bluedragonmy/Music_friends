import { NextResponse } from "next/server";
import { RevealService } from "../../../lib/services/reveal";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";

export async function GET(request: Request) {
  try {
    // 1. 優先從目前 Session 讀取登入用戶 Email
    const session = await getServerSession(authOptions);
    let email = session?.user?.email;

    const { searchParams } = new URL(request.url);
    const shuffle = searchParams.get("regenerate") === "true" || searchParams.get("shuffle") === "true";

    // 2. 若無 Session (例如測試或開發)，從 Query 參數中獲取
    if (!email) {
      email = searchParams.get("email") || undefined;
    }

    // 3. Fallback 到預設測試人格 (User B)
    if (!email) {
      email = "test_b@example.com";
    }

    const payload = await RevealService.getRevelationForUser(email, undefined, shuffle);
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("❌ Failed to generate revelations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate revelations" },
      { status: 500 }
    );
  }
}
