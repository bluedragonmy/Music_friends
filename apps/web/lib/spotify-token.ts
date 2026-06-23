// ── Spotify Token 自動刷新工具 ─────────────────────────────────────────
import { prisma } from "@/lib/prisma";

/**
 * 取得指定使用者的有效 Spotify Access Token。
 * 若 Token 已過期（或即將在 5 分鐘內過期），自動使用 refresh_token 刷新並更新資料庫。
 * @param userId 使用者的 DB ID
 * @returns 有效的 access_token，或在無法刷新時回傳 null
 */
export async function getValidSpotifyToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "spotify" },
  });

  if (!account?.access_token) return null;

  const expiresAt = account.expires_at || 0;
  // 提前 5 分鐘視為即將過期
  const isExpired = Date.now() >= (expiresAt - 300) * 1000;

  if (!isExpired) {
    // Token 還有效，直接回傳
    return account.access_token;
  }

  if (!account.refresh_token) {
    console.warn(`[Spotify Token] 用戶 ${userId} 無 refresh_token，無法自動刷新，請重新登入 Spotify。`);
    return null;
  }

  // Token 已過期 → 使用 refresh_token 申請新的
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

    if (!res.ok || !data.access_token) {
      console.error(`[Spotify Token] 自動刷新失敗 (userId=${userId}):`, data);
      return null;
    }

    const newExpiresAt = Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600);

    // 寫回資料庫
    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: data.access_token,
        expires_at: newExpiresAt,
        // Spotify 有時會在刷新時發新的 refresh_token，一併更新
        ...(data.refresh_token && { refresh_token: data.refresh_token }),
      },
    });

    console.log(`[Spotify Token] ✅ 成功為用戶 ${userId} 自動刷新 Access Token（有效至 ${new Date(newExpiresAt * 1000).toISOString()}）`);
    return data.access_token;
  } catch (err) {
    console.error(`[Spotify Token] 刷新時發生例外 (userId=${userId}):`, err);
    return null;
  }
}
