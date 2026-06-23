import { prisma } from "@/lib/prisma";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

/**
 * 自動檢查並更新使用者的 Spotify Access Token
 * @param userId 使用者 ID
 * @returns 有效的 Access Token，或 null (如果未綁定或更新失敗)
 */
export async function getValidSpotifyToken(userId: string): Promise<string | null> {
  try {
    const account = await prisma.account.findFirst({
      where: { userId, provider: "spotify" },
    });

    if (!account || !account.access_token || !account.refresh_token) {
      return null;
    }

    // 檢查是否過期 (保險起見，提早 5 分鐘判定過期)
    const nowEpoch = Math.floor(Date.now() / 1000);
    const expiresAt = account.expires_at ?? 0;

    if (nowEpoch < expiresAt - 300) {
      // 尚未過期，直接回傳
      return account.access_token;
    }

    // 已經過期，向 Spotify 申請更新 Token
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: account.refresh_token,
      }),
    });

    const tokens = await response.json();

    if (!response.ok) {
      console.error("❌ [Spotify Token Refresh Error]:", tokens);
      throw tokens;
    }

    // 將新 Token 寫回資料庫
    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: tokens.access_token,
        expires_at: nowEpoch + tokens.expires_in,
        // Spotify 不一定每次都會給新的 refresh_token
        refresh_token: tokens.refresh_token ?? account.refresh_token,
      },
    });

    console.log(`♻️ [Spotify Token] Successfully refreshed token for user: ${userId}`);
    return tokens.access_token;

  } catch (error) {
    console.error("❌ [getValidSpotifyToken Error]:", error);
    return null;
  }
}
