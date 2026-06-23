import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const callbackUrl = searchParams.get("callbackUrl") || "/onboarding";

    // Spotify 2025 新規定：禁止使用 localhost 作為 redirect_uri
    if (url.hostname === "localhost") {
      const currentPort = url.port ? `:${url.port}` : "";
      const targetUrl = `http://127.0.0.1${currentPort}${callbackUrl}`;

      return new NextResponse(
        `<html>
          <head>
            <title>Spotify 授權限制</title>
          </head>
          <body style="background:#050505; color:#fff; font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; text-align:center; padding: 20px; line-height: 1.6;">
            <div style="background: rgba(255,255,255,0.03); padding: 40px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.08); max-width: 450px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
              <h2 style="color: #ef4444; margin-bottom: 20px;">⚠️ Spotify 授權限制</h2>
              <p style="color: #ccc; font-size: 14px;">Spotify 官方安全政策規定自 2025 年起<b>禁止</b>將 <code>localhost</code> 作為授權重導向網址。</p>
              <p style="color: #ccc; font-size: 14px; margin-bottom: 30px;">請改以 <b>127.0.0.1</b> 進入網站進行登入與綁定，否則將無法完成 Spotify 連結。</p>
              <a href="${targetUrl}" style="color:#ffffff; background:#1db954; font-size:15px; font-weight:bold; text-decoration:none; padding: 12px 30px; border-radius: 100px; display:inline-block; transition: background 0.2s;">
                切換至 127.0.0.1
              </a>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "Spotify client ID is not configured" },
        { status: 500 }
      );
    }

    // 動態根據當前請求的 origin 構建 redirect_uri
    const origin = url.origin;
    const redirectUri = `${origin}/api/spotify/callback`;

    // 產生並設置 state 作為 CSRF 防護
    const state = crypto.randomBytes(16).toString("hex");

    const cookieStore = await cookies();
    cookieStore.set("spotify_link_callback_url", callbackUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 600, // 10 mins
      path: "/",
    });
    
    cookieStore.set("spotify_auth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      path: "/",
    });

    const scopes = [
      "user-read-email",
      "user-top-read",
      "user-read-private",
      "streaming",
      "user-modify-playback-state",
      "user-read-playback-state",
      "user-read-currently-playing",
      "user-read-recently-played"
    ].join(" ");

    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?` +
      new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        scope: scopes,
        redirect_uri: redirectUri,
        state: state,
      }).toString();

    return NextResponse.redirect(spotifyAuthUrl);
  } catch (error) {
    console.error("[Spotify Auth Redirect Error]:", error);
    return NextResponse.json(
      { error: "Failed to initiate Spotify authorization" },
      { status: 500 }
    );
  }
}
