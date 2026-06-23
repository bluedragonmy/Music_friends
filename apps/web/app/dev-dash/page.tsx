"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

interface Track {
  spotifyId?: string;
  youtubeId?: string;
  title: string;
  artist: string;
  album: string;
  coverImg: string | null;
  duration: number;
  previewUrl: string | null;
  url?: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [ytTracks, setYtTracks] = useState<Track[]>([]);
  const [ytSyncStatus, setYtSyncStatus] = useState("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [candidateMode, setCandidateMode] = useState<"random" | "similar">("random");
  const [candidateStatus, setCandidateStatus] = useState("");
  const [rooms, setRooms] = useState<any[]>([]);
  const [matchStatus, setMatchStatus] = useState("");

  async function handleFetchTopTracks() {
    setLoading(true);
    setSyncStatus("");
    try {
      const res = await fetch("/api/spotify/top-tracks");
      if (res.status === 401) {
        setSyncStatus("⚠️ Spotify 授權過期或未授權，請重新登入 Spotify");
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setTracks(data);
      setSyncStatus("✅ 成功從 Spotify 取得最常聽歌曲！");
    } catch (err: any) {
      setSyncStatus("❌ 抓取失敗：" + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncToDB() {
    if (tracks.length === 0) return;
    setLoading(true);
    setSyncStatus("⏳ 正在將音樂人格固化至資料庫...");
    try {
      const res = await fetch("/api/playlists/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSyncStatus("🚀 音樂人格已成功建立！(Playlist ID: " + data.playlistId + ")");
    } catch (err: any) {
      setSyncStatus("❌ 同步失敗：" + err.message);
    } finally {
      setLoading(false);
    }
  }

  // YouTube Music 相關功能
  async function handleFetchYouTubeLiked() {
    setLoading(true);
    setYtSyncStatus("⏳ 正在從 YouTube Music 拓取喜歡的音樂影片...");
    setYtTracks([]);
    try {
      const res = await fetch("/api/youtube/liked-videos");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setYtTracks(data);
      setYtSyncStatus(`✅ 成功取得 ${data.length} 首 YouTube Music 喜歡影片！`);
    } catch (err: any) {
      setYtSyncStatus("❌ 拓取失敗：" + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncYouTubeToDB() {
    if (ytTracks.length === 0) return;
    setLoading(true);
    setYtSyncStatus("⏳ 正在將 YouTube Music 人格固化至資料庫...");
    try {
      const res = await fetch("/api/youtube/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: ytTracks }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setYtSyncStatus("🚀 YouTube Music 音樂人格已成功建立！(Playlist ID: " + data.playlistId + ")");
    } catch (err: any) {
      setYtSyncStatus("❌ 同步失敗：" + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchCandidates(mode: "random" | "similar") {
    setLoading(true);
    setCandidateStatus("⏳ 查詢中...");
    setCandidates([]);
    try {
      const res = await fetch(`/api/match/candidates?mode=${mode}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCandidates(data.candidates);
      setCandidateStatus(`✅ [${data.mode.toUpperCase()} 模式] 取得 ${data.candidates.length} 位候選人`);
    } catch (err: any) {
      setCandidateStatus("❌ 失敗：" + err.message);
    } finally {
      setLoading(false);
    }
  }

  // 取得現有聊天室清單
  async function handleFetchRooms() {
    try {
      const res = await fetch("/api/chat/list");
      const data = await res.json();
      if (!data.error) {
        setRooms(data.rooms || []);
      }
    } catch (err) {
      console.error("無法取得聊天室:", err);
    }
  }

  // 測試專用：一鍵清空我所有的配對與滑動歷史紀錄
  async function handleResetTestData() {
    setLoading(true);
    setCandidateStatus("⏳ 正在重設測試紀錄...");
    try {
      const res = await fetch("/api/test/reset", { method: "POST" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCandidateStatus("🧹 歷史配對與滑動紀錄已清空！候選人名單已重設。");
      setCandidates([]);
      setRooms([]);
      setMatchStatus("");
    } catch (err: any) {
      setCandidateStatus("❌ 重設失敗：" + err.message);
    } finally {
      setLoading(false);
    }
  }

  // 1. 模擬對方對我按下 LIKE
  async function handleSimulateLike(candidateId: string) {
    setMatchStatus("⏳ 正在模擬對方對您示好...");
    try {
      const res = await fetch("/api/test/simulate-like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMatchStatus(`💖 成功！${candidates.find(c => c.id === candidateId)?.name || "對方"} 已經喜歡您。現在對他按下 LIKE 即可觸發配對！`);
    } catch (err: any) {
      setMatchStatus("❌ 模擬失敗：" + err.message);
    }
  }

  // 2. 對候選人按下 LIKE (觸發配對判定)
  async function handleLikeBack(candidateId: string) {
    setMatchStatus("⏳ 正在配對中...");
    try {
      const res = await fetch("/api/match/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: candidateId, action: "LIKE" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      if (data.isMatch) {
        setMatchStatus(`🎉 配對成功！與 ${candidates.find(c => c.id === candidateId)?.name} 達成音樂品味契合！`);
        // 重新整理聊天室清單
        handleFetchRooms();
        // 移除已配對的候選人
        setCandidates(prev => prev.filter(c => c.id !== candidateId));
      } else {
        setMatchStatus("👍 已送出喜歡！(若對方也喜歡您將會配對成功)");
        setCandidates(prev => prev.filter(c => c.id !== candidateId));
      }
    } catch (err: any) {
      setMatchStatus("❌ 配對失敗：" + err.message);
    }
  }

  // 3. 注入測試假歌單給當前使用者
  async function handleInjectMockPlaylist() {
    setSyncStatus("⏳ 正在注入測試歌單...");
    try {
      const res = await fetch("/api/test/inject-mock-playlist", {
        method: "POST",
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSyncStatus("✅ 測試歌單注入成功！您現在可以回到首頁進行配對了！");
    } catch (err: any) {
      setSyncStatus("❌ 注入失敗：" + err.message);
    }
  }

  // 當 session 載入後，自動獲取現有的配對聊天室
  useState(() => {
    if (session) {
      handleFetchRooms();
    }
  });

  if (session) {
    return (
      <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <p style={{ color: "#f8fafc" }}>Hi, <strong>{session.user?.name || session.user?.email}</strong> 👋</p>
          <button
            onClick={() => signOut()}
            style={{ padding: "8px 16px", cursor: "pointer", borderRadius: "8px", border: "1px solid #475569", background: "transparent", color: "#f8fafc" }}
          >
            登出
          </button>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <button
            onClick={handleFetchTopTracks}
            disabled={loading}
            style={{ padding: "12px 24px", cursor: "pointer", background: "#1db954", color: "white", border: "none", borderRadius: "24px", fontWeight: "bold", fontSize: "16px" }}
          >
            {loading ? "載入中..." : "🎧 抓取我的 Spotify Top 5"}
          </button>
          
          {tracks.length > 0 && (
            <button
              onClick={handleSyncToDB}
              disabled={loading}
              style={{ padding: "12px 24px", cursor: "pointer", background: "#3b82f6", color: "white", border: "none", borderRadius: "24px", fontWeight: "bold", fontSize: "16px" }}
            >
              💾 儲存為我的音樂人格
            </button>
          )}

          <button
            onClick={handleInjectMockPlaylist}
            disabled={loading}
            style={{ padding: "12px 24px", cursor: "pointer", background: "#f59e0b", color: "white", border: "none", borderRadius: "24px", fontWeight: "bold", fontSize: "16px" }}
          >
            🧪 注入測試假歌單 (若無法抓取 Spotify)
          </button>
        </div>

        {syncStatus && (
          <p style={{ padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", borderLeft: "4px solid #1db954", color: "#e2e8f0", fontSize: "14px" }}>
            {syncStatus}
          </p>
        )}

        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {tracks.map((track, idx) => (
            <div key={track.spotifyId || track.youtubeId} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
              <div style={{ fontWeight: "bold", color: "#94a3b8", width: "20px", textAlign: "center" }}>{idx + 1}</div>
              {track.coverImg ? (
                <img src={track.coverImg} alt="Cover" style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "60px", height: "60px", borderRadius: "8px", background: "#334155" }} />
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "#f8fafc" }}>{track.title}</h3>
                <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>{track.artist} &middot; {track.album}</p>
              </div>
              {track.previewUrl && (
                <audio controls src={track.previewUrl} style={{ height: "36px" }} />
              )}
            </div>
          ))}
        </div>

        {/* ── YouTube Music 區塊 ───────────────────────────────── */}
        <div style={{ marginTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "1rem", color: "#f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ background: "#ff0000", padding: "2px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" }}>YT</span>
            YouTube Music 喜歡的音樂
          </h2>

          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <button
              onClick={handleFetchYouTubeLiked}
              disabled={loading}
              style={{ padding: "10px 20px", cursor: "pointer", background: "#ff0000", color: "white", border: "none", borderRadius: "24px", fontWeight: "bold", fontSize: "14px" }}
            >
              {loading ? "載入中..." : "▶️ 抓取 YouTube 喜歡的音樂"}
            </button>

            {ytTracks.length > 0 && (
              <button
                onClick={handleSyncYouTubeToDB}
                disabled={loading}
                style={{ padding: "10px 20px", cursor: "pointer", background: "#3b82f6", color: "white", border: "none", borderRadius: "24px", fontWeight: "bold", fontSize: "14px" }}
              >
                💾 儲存為我的 YT 音樂人格
              </button>
            )}
          </div>

          {ytSyncStatus && (
            <p style={{ padding: "10px 14px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", borderLeft: "4px solid #ff0000", color: "#e2e8f0", fontSize: "14px", marginBottom: "1rem" }}>
              {ytSyncStatus}
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {ytTracks.map((track, idx) => (
              <div key={track.youtubeId} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px", background: "rgba(255,0,0,0.04)", border: "1px solid rgba(255,0,0,0.1)", borderRadius: "12px" }}>
                <div style={{ fontWeight: "bold", color: "#94a3b8", width: "20px", textAlign: "center" }}>{idx + 1}</div>
                {track.coverImg ? (
                  <img src={track.coverImg} alt="Thumbnail" style={{ width: "60px", height: "45px", borderRadius: "6px", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "60px", height: "45px", borderRadius: "6px", background: "#334155" }} />
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "15px", color: "#f8fafc" }}>{track.title}</h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>{track.artist} &middot; YouTube Music</p>
                </div>
                {track.url && (
                  <a
                    href={track.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: "6px 12px", background: "#ff0000", color: "white", borderRadius: "14px", fontSize: "12px", fontWeight: "bold", textDecoration: "none" }}
                  >
                    ▶ 播放
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── 配對候選人測試區塊 ─────────────────────────────── */}
        <div style={{ marginTop: "3rem", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#f8fafc" }}>🧪 配對候選人 API 測試</h2>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <button
              id="btn-candidates-random"
              onClick={() => handleFetchCandidates("random")}
              disabled={loading}
              style={{ padding: "10px 20px", cursor: "pointer", background: "#8b5cf6", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold" }}
            >
              🎲 Random 模式
            </button>
            <button
              id="btn-candidates-similar"
              onClick={() => handleFetchCandidates("similar")}
              disabled={loading}
              style={{ padding: "10px 20px", cursor: "pointer", background: "#f59e0b", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold" }}
            >
              🎵 Similar 模式（共同藝人）
            </button>
            <button
              id="btn-reset-test"
              onClick={handleResetTestData}
              disabled={loading}
              style={{ padding: "10px 20px", cursor: "pointer", background: "#ef4444", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold" }}
            >
              🧹 一鍵重設配對
            </button>
          </div>

          {candidateStatus && (
            <p style={{ padding: "10px 14px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", borderLeft: "4px solid #8b5cf6", color: "#e2e8f0", fontSize: "14px", marginBottom: "1rem" }}>
              {candidateStatus}
            </p>
          )}

          {matchStatus && (
            <p style={{ padding: "10px 14px", background: "rgba(245, 158, 11, 0.15)", borderRadius: "8px", borderLeft: "4px solid #f59e0b", color: "#fef3c7", fontSize: "14px", marginBottom: "1rem" }}>
              {matchStatus}
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {candidates.map((c, idx) => (
              <div key={c.id} style={{ padding: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.08)", fontSize: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#f8fafc" }}><strong>#{idx + 1} {c.name || c.email}</strong></span>
                  {c.similarityScore !== undefined && (
                    <span style={{ background: "rgba(245, 158, 11, 0.2)", color: "#fef3c7", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>
                      共同藝人：{c.similarityScore}
                    </span>
                  )}
                </div>
                {c.playlists?.[0] && (
                  <div style={{ marginTop: "6px", color: "#94a3b8" }}>
                    🎵 歌單：{c.playlists[0].name} ({c.playlists[0].tracks.length} 首)
                    <span style={{ marginLeft: "8px" }}>
                      {c.playlists[0].tracks.map((t: any) => t.track.artist).join(" / ")}
                    </span>
                  </div>
                )}
                
                {/* 測試控制按鈕 */}
                <div style={{ display: "flex", gap: "10px", marginTop: "12px", borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: "10px" }}>
                  <button
                    onClick={() => handleSimulateLike(c.id)}
                    style={{ padding: "6px 12px", background: "#f59e0b", color: "white", border: "none", borderRadius: "14px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    🗳️ 1. 模擬對方 LIKE 我
                  </button>
                  <button
                    onClick={() => handleLikeBack(c.id)}
                    style={{ padding: "6px 12px", background: "#10b981", color: "white", border: "none", borderRadius: "14px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    💖 2. 對他按下 LIKE (契合)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 💬 您的配對聊天室清單區塊 ─────────────────────────── */}
        <div style={{ marginTop: "3rem", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", color: "#f8fafc", margin: 0 }}>💬 您的限時配對聊天室</h2>
            <button
              onClick={handleFetchRooms}
              style={{ padding: "4px 10px", background: "transparent", border: "1px solid #475569", borderRadius: "6px", fontSize: "12px", cursor: "pointer", color: "#f8fafc" }}
            >
              🔄 重新整理聊天室
            </button>
          </div>

          {rooms.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "14px", textAlign: "center", padding: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }}>
              目前尚無配對成功的對話。使用上方的模擬按鈕，輕鬆配對第一個伴侶吧！
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {rooms.map((room) => (
                <a
                  key={room.id}
                  href={`/chat/${room.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "16px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                    textDecoration: "none",
                    color: "#f8fafc",
                    borderLeft: room.status === "MATCHED" ? "5px solid #10b981" : room.status === "CLOSED" ? "5px solid #ef4444" : "5px solid #f59e0b",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(5px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                >
                  {room.partner.image ? (
                    <img src={room.partner.image} alt="Avatar" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#475569", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>👤</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: "0 0 2px 0", fontSize: "15px", color: "#f8fafc" }}>{room.partner.name}</h4>
                    <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                      狀態：<strong>{room.status === "MATCHED" ? "🌟 永久好友" : room.status === "CLOSED" ? "🔒 唯讀存檔" : "⏳ 48小時交流中"}</strong>
                    </p>
                  </div>
                  <div style={{ fontSize: "12px", color: "#8b5cf6" }}>
                    進入聊天室 →
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "4rem 2rem", display: "flex", gap: "1rem", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>建立你的音樂人格</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>登入 Spotify 以擷取您最喜愛的歌曲</p>
      
      <button
        onClick={() => signIn("spotify")}
        style={{ padding: "14px 32px", cursor: "pointer", background: "#1db954", color: "white", border: "none", borderRadius: "32px", fontWeight: "bold", fontSize: "18px", display: "flex", alignItems: "center", gap: "8px" }}
      >
        使用 Spotify 登入
      </button>


    </div>
  );
}
