"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Disc3, LogOut, MessageCircle, User, RefreshCw, Share2, Sparkles, ChevronRight } from "lucide-react";
import MusicMindMap from "@/components/profile/MusicMindMap";
import ShareCardModal from "@/components/profile/ShareCardModal";

export default function ProfilePage() {
  const { data: userSession, status: authStatus } = useSession();
  const navigation = useRouter();

  const [userStats, setUserStats] = useState<any>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [timeDimension, setTimeDimension] = useState<string>("week");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      navigation.push("/login");
    }
  }, [authStatus, navigation]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      loadUserStats(false, timeDimension);
    }
  }, [authStatus, timeDimension]);

  const loadUserStats = async (forceSync = false, targetDimension = timeDimension) => {
    if (forceSync) setIsSyncingData(true);
    setIsStatsLoading(true);
    try {
      const apiEndpoint = "/api/stats";
      const queryParams = new URLSearchParams();
      queryParams.set("dimension", targetDimension);
      if (forceSync) queryParams.set("force", "true");

      const response = await fetch(`${apiEndpoint}?${queryParams.toString()}`);
      if (response.ok) {
        const payload = await response.json();
        setUserStats(payload);
      } else {
        const errorText = await response.text();
        console.error(`[Stats API error] Status: ${response.status}, Details: ${errorText}`);
        alert(`數據同步失敗 (狀態碼: ${response.status}): ${errorText || "請確認已綁定 Spotify 帳號"}`);
      }
    } catch (err) {
      console.error("Network failure loading profile stats:", err);
      alert("載入音樂數據發生網路錯誤，請重試。");
    } finally {
      setIsStatsLoading(false);
      setIsSyncingData(false);
    }
  };

  const decodeVibeMatrix = (matrixStr: string | null) => {
    if (!matrixStr) return { energy: 0.62, danceability: 0.75, valence: 0.58 };
    try {
      return JSON.parse(matrixStr);
    } catch {
      return { energy: 0.62, danceability: 0.75, valence: 0.58 };
    }
  };

  const computeDisplayDuration = (durationMs: number | undefined) => {
    if (!durationMs) return "0 分鐘";
    const totalMinutes = Math.floor(durationMs / 60000);
    const totalHours = Math.floor(totalMinutes / 60);
    if (totalHours > 0) return `${totalHours} 小時 ${totalMinutes % 60} 分鐘`;
    return `${totalMinutes} 分鐘`;
  };

  const currentVibeMetrics = decodeVibeMatrix(userStats?.vibeMatrix);

  const dimensionLabels: { [key: string]: string } = {
    day: "單日",
    week: "本週",
    month: "本月",
    quarter: "本季",
    year: "年度",
  };
  const activeDimensionName = dimensionLabels[timeDimension] || "專屬";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050507",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E")`,
        color: "#ffffff",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Navigation Topbar */}
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          padding: "20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(5, 5, 7, 0.7)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0, letterSpacing: "-0.5px", background: "linear-gradient(135deg, #ffffff, #a3a3a3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            DITTO LOG
          </h1>
          <p style={{ color: "#777777", fontSize: "12px", fontWeight: 500, margin: "2px 0 0 0", letterSpacing: "1px" }}>
            音樂日誌與數據儀表板
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setIsShareModalOpen(true)}
            disabled={isStatsLoading || !userStats}
            title="分享音樂圖卡"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: (isStatsLoading || !userStats) ? "default" : "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!isStatsLoading && userStats) e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              if (!isStatsLoading && userStats) e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
            }}
          >
            <Share2 size={16} color="#ffffff" />
          </button>

          <button
            onClick={() => loadUserStats(true)}
            disabled={isSyncingData}
            title="立即同步 Spotify 聆聽數據"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: isSyncingData ? "default" : "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!isSyncingData) e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              if (!isSyncingData) e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
            }}
          >
            <RefreshCw
              size={16}
              color={isSyncingData ? "#1db954" : "#ffffff"}
              className={isSyncingData ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "450px",
          overflowY: "auto",
          padding: "20px 20px 80px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* User Card */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "24px",
            padding: "24px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            display: "flex",
            alignItems: "center",
            gap: "18px",
            backdropFilter: "blur(10px)",
          }}
        >
          {userSession?.user?.image ? (
            <img
              src={userSession.user.image}
              alt="User profile avatar"
              referrerPolicy="no-referrer"
              style={{ width: "70px", height: "70px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" }}
            />
          ) : (
            <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "#222222", border: "2px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>
              👤
            </div>
          )}
          <div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: 800, letterSpacing: "-0.3px" }}>
              {userSession?.user?.name || "Ditto User"}
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#666666", fontWeight: 500 }}>
              {userSession?.user?.email}
            </p>
          </div>
        </div>

        {/* Edit playlist shortcut */}
        <div
          onClick={() => navigation.push("/playlist/edit")}
          style={{
            background: "linear-gradient(135deg, rgba(29, 185, 84, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)",
            borderRadius: "24px",
            padding: "20px 24px",
            border: "1.5px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.border = "1.5px solid rgba(139, 92, 246, 0.4)";
            e.currentTarget.style.boxShadow = "0 15px 30px rgba(139, 92, 246, 0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.border = "1.5px solid rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.boxShadow = "0 10px 20px rgba(0, 0, 0, 0.2)";
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "14px", zIndex: 10 }}>
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "16px",
                background: "rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
              }}
            >
              <Sparkles size={20} color="#1db954" style={{ animation: "pulse 2s infinite" }} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>
                交友品味歌單捷徑
              </h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#999999" }}>
                一鍵更新您在 Ditto 配對池的 5 首主打歌
              </p>
            </div>
          </div>
          <ChevronRight size={18} color="#888888" style={{ zIndex: 10 }} />
        </div>

        {/* Link spotify banner */}
        {!userSession?.hasSpotifyLinked && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.05)",
              borderRadius: "24px",
              padding: "24px",
              border: "1px solid rgba(239, 68, 68, 0.15)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#fca5a5" }}>音樂平台未連結</h3>
              <span style={{ fontSize: "11px", color: "#ef4444", background: "rgba(239, 68, 68, 0.12)", padding: "4px 12px", borderRadius: "100px", fontWeight: "bold" }}>
                DISCONNECTED
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "13px", color: "#aaaaaa", lineHeight: "1.5" }}>
              連結 Spotify 帳號後，Ditto 將能在背景定期同步您的最近播放紀錄，並產出品味心智圖！
            </p>
            <button
              onClick={() => {
                window.location.href = "/api/spotify/auth?callbackUrl=/profile";
              }}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "100px",
                border: "none",
                background: "linear-gradient(135deg, #1db954, #17a347)",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 6px 16px rgba(29, 185, 84, 0.25)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.01)";
                e.currentTarget.style.boxShadow = "0 8px 22px rgba(29, 185, 84, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(29, 185, 84, 0.25)";
              }}
            >
              🔗 連結 Spotify 帳號
            </button>
          </div>
        )}

        {/* Tab selection for timelines */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "100px",
            padding: "5px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {[
            { id: "day", label: "日" },
            { id: "week", label: "週" },
            { id: "month", label: "月" },
          ].map((tab) => {
            const isTabActive = timeDimension === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTimeDimension(tab.id)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: "100px",
                  border: "none",
                  background: isTabActive ? "rgba(255, 255, 255, 0.08)" : "transparent",
                  color: isTabActive ? "#ffffff" : "#666668",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: isTabActive ? "0 4px 10px rgba(0, 0, 0, 0.3)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isTabActive) e.currentTarget.style.color = "#99999f";
                }}
                onMouseLeave={(e) => {
                  if (!isTabActive) e.currentTarget.style.color = "#666668";
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Stats view */}
        {isStatsLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ height: "96px", background: "rgba(255,255,255,0.02)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", animation: "pulse 1.5s infinite" }} />
            <div style={{ height: "350px", background: "rgba(255,255,255,0.02)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", animation: "pulse 1.5s infinite 0.2s" }} />
            <div style={{ height: "240px", background: "rgba(255,255,255,0.02)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", animation: "pulse 1.5s infinite 0.4s" }} />
          </div>
        ) : (
          <>
            {userStats?.isFallbackToLastActive && userStats?.lastActiveDate && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#f59e0b",
                  background: "rgba(245, 158, 11, 0.05)",
                  padding: "12px 16px",
                  borderRadius: "18px",
                  textAlign: "left",
                  border: "1px solid rgba(245, 158, 11, 0.12)",
                  lineHeight: "1.4",
                }}
              >
                ⚠️ 近期 Spotify 無新聽歌紀錄，已為您載入最近活躍期 ({new Date(userStats.lastActiveDate).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" })}) 的歷史統計。
              </div>
            )}

            <div style={{ display: "flex", gap: "16px" }}>
              <div
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.02)",
                  borderRadius: "24px",
                  padding: "20px",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  backdropFilter: "blur(10px)",
                }}
              >
                <span style={{ fontSize: "11px", color: "#555555", fontWeight: 700, letterSpacing: "1px", marginBottom: "8px" }}>
                  {activeDimensionName.toUpperCase()}聆聽總時長
                </span>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "#1db954", letterSpacing: "-0.5px" }}>
                  {computeDisplayDuration(userStats?.dimensionDurationMs)}
                </span>
              </div>

              <div
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.02)",
                  borderRadius: "24px",
                  padding: "20px",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  backdropFilter: "blur(10px)",
                }}
              >
                <span style={{ fontSize: "11px", color: "#555555", fontWeight: 700, letterSpacing: "1px", marginBottom: "8px" }}>
                  本週聆聽 (累計)
                </span>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "#8b5cf6", letterSpacing: "-0.5px" }}>
                  {computeDisplayDuration(userStats?.weekDurationMs)}
                </span>
              </div>
            </div>

            {/* Mind Map visual */}
            <MusicMindMap
              userImage={userSession?.user?.image}
              userName={userSession?.user?.name}
              topGenres={userStats?.topGenres}
              topTracks={userStats?.topTracks}
            />

            {/* Top Tracks List */}
            {userStats?.topTracks && userStats.topTracks.length > 0 && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  borderRadius: "24px",
                  padding: "24px",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <h3 style={{ margin: "0 0 18px 0", fontSize: "14px", fontWeight: 700, color: "#888888", letterSpacing: "1px" }}>
                  TOP SINGLES {`{熱門單曲}`}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {userStats.topTracks.map((track: any, idx: number) => (
                    <div key={track.id} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <span style={{ fontSize: "14px", color: "#444444", fontWeight: 900, width: "20px" }}>
                        {idx + 1}
                      </span>
                      {track.coverImg ? (
                        <img
                          src={track.coverImg}
                          alt="Cover art"
                          style={{ width: "44px", height: "44px", borderRadius: "10px", objectFit: "cover", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }}
                        />
                      ) : (
                        <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#222222" }} />
                      )}
                      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                          {track.title}
                        </span>
                        <span style={{ fontSize: "12px", color: "#666666", fontWeight: 500, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", marginTop: "2px" }}>
                          {track.artist}
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: "#1db954", background: "rgba(29,185,84,0.1)", padding: "4px 10px", borderRadius: "100px", fontWeight: "bold", flexShrink: 0 }}>
                        {track.count} 次
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Artists List */}
            {userStats?.topArtists && userStats.topArtists.length > 0 && (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  borderRadius: "24px",
                  padding: "24px",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <h3 style={{ margin: "0 0 18px 0", fontSize: "14px", fontWeight: 700, color: "#888888", letterSpacing: "1px" }}>
                  TOP ARTISTS {`{熱門歌手}`}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {userStats.topArtists.map((artist: { name: string; count: number }, idx: number) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <span style={{ fontSize: "14px", color: "#444444", fontWeight: 900, width: "20px" }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: "14px", color: "#eeeeee", fontWeight: 700 }}>
                          {artist.name}
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: "#8b5cf6", background: "rgba(139,92,246,0.1)", padding: "4px 10px", borderRadius: "100px", fontWeight: "bold" }}>
                        {artist.count} 次
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
              <button
                onClick={() => setIsShareModalOpen(true)}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "100px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  background: "rgba(255, 255, 255, 0.03)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)")}
              >
                <Share2 size={16} />
                匯出社群分享圖卡
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "100px",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  background: "rgba(239, 68, 68, 0.04)",
                  color: "#fca5a5",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.04)")}
              >
                <LogOut size={16} />
                登出 Ditto 系統
              </button>
            </div>
          </>
        )}
      </div>

      {/* Share Modal Dialog */}
      {userStats && (
        <ShareCardModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          userImage={userSession?.user?.image}
          userName={userSession?.user?.name}
          dimension={timeDimension}
          dimensionDurationMs={userStats?.dimensionDurationMs || 0}
          topGenres={userStats?.topGenres || []}
          topTracks={userStats?.topTracks || []}
        />
      )}

      {/* Nav footer */}
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(5, 5, 7, 0.85)",
          backdropFilter: "blur(20px)",
          position: "fixed",
          bottom: 0,
          zIndex: 50,
        }}
      >
        <Link href="/" style={{ color: "#666666", textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Disc3 size={24} />
        </Link>
        <Link href="/chat" style={{ color: "#666666", textDecoration: "none", display: "flex", alignItems: "center" }}>
          <MessageCircle size={24} />
        </Link>
        <Link href="/profile" style={{ color: "#ffffff", textDecoration: "none", display: "flex", alignItems: "center" }}>
          <User size={24} style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.2))" }} />
        </Link>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.96); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
