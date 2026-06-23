/**
 * app/api/spotify/token/route.ts
 * 安全端點：允許已登入的使用者獲取自己在資料庫中最新的 Spotify Access Token，供 Web Playback SDK 初始化使用。
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 取得使用者的 Spotify Account 紀錄
    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: "spotify",
      },
    });

    if (!account || !account.access_token) {
      return NextResponse.json(
        { error: "Spotify account not linked or access token missing" },
        { status: 401 }
      );
    }

    let accessToken = account.access_token;
    let expiresAt = account.expires_at || 0;

    // 檢查是否過期 (或在 5 分鐘內即將過期)
    const isExpired = Date.now() >= (expiresAt - 300) * 1000;

    if (isExpired && account.refresh_token) {
      try {
        const clientId = process.env.SPOTIFY_CLIENT_ID!;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

        const res = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${basicAuth}`,
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: account.refresh_token,
          }),
        });

        const data = await res.json();
        if (res.ok && data.access_token) {
          accessToken = data.access_token;
          expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;

          // 更新資料庫中的 Token
          await prisma.account.update({
            where: { id: account.id },
            data: {
              access_token: accessToken,
              expires_at: expiresAt,
              // 如果 Spotify 還有回傳新的 refresh_token，也要一併更新
              ...(data.refresh_token && { refresh_token: data.refresh_token }),
            },
          });
          console.log(`[Spotify Token] 成功為用戶 ${user.email} 刷新 Access Token`);
        } else {
          console.warn("[Spotify Token] Refresh token failed:", data);
        }
      } catch (refreshErr) {
        console.error("[Spotify Token] Refresh token error:", refreshErr);
      }
    }

    return NextResponse.json({
      accessToken,
      expiresAt,
    });
  } catch (error) {
    console.error("[Spotify Token API Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch Spotify access token" },
      { status: 500 }
    );
  }
}
