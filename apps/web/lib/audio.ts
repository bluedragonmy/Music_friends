// ── 音樂試聽工具（已移除網易雲爬蟲） ────────────────────────────────────
// Spotify previewUrl 為 null 的歌曲直接靜音，不使用任何第三方備用連結。

/**
 * 保留此函數簽名以相容舊有呼叫端，但現在只回傳 null。
 * Spotify 自 2024 年起已對部分地區停止提供 preview_url，
 * 我們選擇靜音而非播放不相關的替代音訊。
 * @deprecated 此函數不再爬取外部音訊，保留是為了避免 import 錯誤
 */
export async function fetchFallbackPreviewUrl(_title: string, _artist: string): Promise<string | null> {
  return null;
}
