import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams, origin } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    const cookieStore = await cookies();
    const savedState = cookieStore.get("spotify_auth_state")?.value;
    const callbackUrl = cookieStore.get("spotify_link_callback_url")?.value || "/onboarding";

    // 清理 Cookie
    cookieStore.delete("spotify_auth_state");
    cookieStore.delete("spotify_link_callback_url");

    // 1. 驗證 State 防範 CSRF 攻擊
    if (!state || state !== savedState) {
      return NextResponse.json({ error: "State mismatch / CSRF detected" }, { status: 400 });
    }

    // 2. 獲取當前已登入使用者
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      // 若未登入，跳轉至登入頁面
      return NextResponse.redirect(`${origin}/login?error=SessionExpired`);
    }

    if (!code) {
      return NextResponse.json({ error: "Authorization code is missing" }, { status: 400 });
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID!;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
    const redirectUri = `${origin}/api/spotify/callback`;

    // 3. 向 Spotify 交換 Access/Refresh Token
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[Spotify Token Exchange Failed]:", tokenData);
      return NextResponse.json({ error: "Failed to exchange authorization code" }, { status: 500 });
    }

    const { access_token, refresh_token, expires_in, scope } = tokenData;

    // 4. 取得該 Spotify 帳號的 Profile 以獲取用戶 ID
    const meRes = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const meData = await meRes.json();
    if (!meRes.ok || !meData.id) {
      console.error("[Spotify Fetch Me Failed]:", meData);
      return NextResponse.json({ error: "Failed to fetch Spotify user profile" }, { status: 500 });
    }

    const providerAccountId = meData.id;

    // 5. 綁定此 Account 到當前已登入的使用者中
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "spotify",
          providerAccountId,
        },
      },
      update: {
        userId: session.user.id, // 更新綁定到當前使用者
        access_token,
        refresh_token: refresh_token || undefined,
        expires_at: Math.floor(Date.now() / 1000) + expires_in,
        scope,
      },
      create: {
        userId: session.user.id,
        type: "oauth",
        provider: "spotify",
        providerAccountId,
        access_token,
        refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + expires_in,
        token_type: "Bearer",
        scope,
      },
    });

    console.log(`⚡ [Spotify Callback]: Linked Spotify account (${providerAccountId}) to user: ${session.user.id}`);

    // 6. 重導向回原本要求綁定的頁面
    return NextResponse.redirect(`${origin}${callbackUrl}`);
  } catch (error) {
    console.error("[Spotify Callback Route Error]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
