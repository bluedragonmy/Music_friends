"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UserTrack {
  spotifyId?: string;
  title: string;
  artist: string;
  album: string;
  coverImg: string | null;
  duration: number;
  previewUrl: string | null;
}

export default function OnboardingPage() {
  const { data: userSession, status: authStatus } = useSession();
  const navigation = useRouter();

  const [activeStep, setActiveStep] = useState(1);
  const [isSyncProcessing, setIsSyncProcessing] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<UserTrack[]>([]);
  const [errorNotification, setErrorNotification] = useState("");
  const [userNickname, setUserNickname] = useState("");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      navigation.push("/login");
    } else if (authStatus === "authenticated" && userSession?.user?.name) {
      setUserNickname(userSession.user.name);
    }
  }, [authStatus, userSession, navigation]);

  const fetchUsersTopTracks = async () => {
    setIsSyncProcessing(true);
    setErrorNotification("");
    try {
      const response = await fetch("/api/spotify/top-tracks");
      if (response.status === 401) {
        setErrorNotification("⚠️ Spotify 授權過期或未授權，請重新登入 Spotify");
        setIsSyncProcessing(false);
        return;
      }

      const payload = await response.json();
      if (payload.error) throw new Error(payload.error);

      setSelectedTracks(payload);
      setActiveStep(2);
    } catch (err: any) {
      setErrorNotification("❌ 抓取失敗：" + err.message);
    } finally {
      setIsSyncProcessing(false);
    }
  };

  const populateMockPlaylistsDirectly = async () => {
    setIsSyncProcessing(true);
    setErrorNotification("");
    try {
      const response = await fetch("/api/test/inject-mock-playlist", {
        method: "POST",
      });
      const payload = await response.json();
      if (payload.error) throw new Error(payload.error);

      if (userNickname.trim()) {
        await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: userNickname }),
        });
      }

      navigation.push("/");
    } catch (err: any) {
      setErrorNotification("❌ 注入測試歌單失敗：" + err.message);
      setIsSyncProcessing(false);
    }
  };

  const finalizeOnboarding = async () => {
    if (!userNickname.trim()) {
      setErrorNotification("請填寫您的暱稱");
      return;
    }

    setIsSyncProcessing(true);
    setErrorNotification("");

    try {
      // 1. Sync tracks
      if (selectedTracks.length > 0) {
        const syncResponse = await fetch("/api/playlists/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tracks: selectedTracks }),
        });
        const syncPayload = await syncResponse.json();
        if (syncPayload.error) throw new Error(syncPayload.error);
      }

      // 2. Sync profile nickname
      const profileResponse = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userNickname }),
      });
      const profilePayload = await profileResponse.json();
      if (profilePayload.error) throw new Error(profilePayload.error);

      navigation.push("/");
    } catch (err: any) {
      setErrorNotification("❌ 儲存失敗：" + err.message);
      setIsSyncProcessing(false);
    }
  };

  if (authStatus === "loading") {
    return <div style={{ minHeight: "100vh", backgroundColor: "#050505" }}></div>;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050505",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        color: "#ffffff",
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(25px)",
          WebkitBackdropFilter: "blur(25px)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "32px",
          padding: "3rem 2rem",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 40px 80px -20px rgba(0, 0, 0, 0.8)",
          maxWidth: "500px",
          width: "100%",
        }}
      >
        {/* Step dots */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "2rem" }}>
          <div style={{ height: "4px", flex: 1, background: activeStep >= 1 ? "#1db954" : "rgba(255,255,255,0.1)", borderRadius: "2px", transition: "background 0.3s" }}></div>
          <div style={{ height: "4px", flex: 1, background: activeStep >= 2 ? "#1db954" : "rgba(255,255,255,0.1)", borderRadius: "2px", transition: "background 0.3s" }}></div>
        </div>

        {activeStep === 1 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 12px 0" }}>匯入你的音樂基因</h2>
            <p style={{ color: "#888888", fontSize: "14px", margin: "0 0 1rem 0", lineHeight: "1.5" }}>
              我們需要存取您的 Spotify Top 5 歌曲，<br />來為您尋找最契合的靈魂伴侶。
            </p>

            <input
              type="text"
              placeholder="給自己取個好聽的暱稱吧"
              value={userNickname}
              onChange={(e) => setUserNickname(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.5)",
                color: "#ffffff",
                marginBottom: "2rem",
                fontSize: "14px",
                textAlign: "center",
              }}
            />

            {!userSession?.hasSpotifyLinked ? (
              <>
                <div
                  style={{
                    background: "rgba(29, 185, 84, 0.08)",
                    border: "1px solid rgba(29, 185, 84, 0.25)",
                    borderRadius: "16px",
                    padding: "14px 18px",
                    marginBottom: "1.5rem",
                    fontSize: "13px",
                    color: "#6ee7a0",
                    lineHeight: "1.6",
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  💡 您目前尚未授權 Spotify。<br />點擊下方按鈕，完成一次性授權後即可擷取您的音樂數據。
                </div>

                <button
                  onClick={() => {
                    window.location.href = "/api/spotify/auth";
                  }}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "100px",
                    border: "none",
                    background: "linear-gradient(135deg, #1db954, #17a347)",
                    color: "#ffffff",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    boxShadow: "0 4px 20px rgba(29, 185, 84, 0.4)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(29, 185, 84, 0.55)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(29, 185, 84, 0.4)";
                  }}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.56.3z" />
                  </svg>
                  🔗 連結 Spotify 帳號
                </button>

                <button
                  onClick={populateMockPlaylistsDirectly}
                  disabled={isSyncProcessing || !userNickname.trim()}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "100px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "transparent",
                    color: "#ffffff",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: isSyncProcessing || !userNickname.trim() ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    marginTop: "1rem",
                    opacity: isSyncProcessing || !userNickname.trim() ? 0.5 : 1,
                  }}
                >
                  🧪 略過：直接產生隨機測試歌單
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    background: "rgba(29, 185, 84, 0.08)",
                    border: "1px solid rgba(29, 185, 84, 0.25)",
                    borderRadius: "16px",
                    padding: "14px 18px",
                    marginBottom: "1.5rem",
                    fontSize: "13px",
                    color: "#6ee7a0",
                    lineHeight: "1.6",
                    width: "100%",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>✅</span>
                  <span>Spotify 帳號已成功連結！<br />點擊下方按鈕擷取你的常聽歌曲。</span>
                </div>

                <button
                  onClick={fetchUsersTopTracks}
                  disabled={isSyncProcessing}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "100px",
                    border: "none",
                    background: "#1db954",
                    color: "#ffffff",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: isSyncProcessing ? "not-allowed" : "pointer",
                    opacity: isSyncProcessing ? 0.7 : 1,
                    transition: "transform 0.2s, background 0.2s",
                    boxShadow: "0 4px 14px rgba(29, 185, 84, 0.3)",
                  }}
                >
                  {isSyncProcessing ? "載入中..." : "🎧 擷取 Spotify 常聽歌曲"}
                </button>

                <button
                  onClick={populateMockPlaylistsDirectly}
                  disabled={isSyncProcessing || !userNickname.trim()}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "100px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "transparent",
                    color: "#ffffff",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: isSyncProcessing || !userNickname.trim() ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    marginTop: "1rem",
                    opacity: isSyncProcessing || !userNickname.trim() ? 0.5 : 1,
                  }}
                >
                  🧪 略過：直接產生隨機測試歌單
                </button>
              </>
            )}
          </div>
        )}

        {activeStep === 2 && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 12px 0", textAlign: "center" }}>確認你的音樂人格</h2>
            <p style={{ color: "#888888", fontSize: "14px", margin: "0 0 1.5rem 0", lineHeight: "1.5", textAlign: "center" }}>
              這些歌曲將成為您的配對名片。
            </p>

            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "16px", padding: "16px", marginBottom: "1.5rem", maxHeight: "250px", overflowY: "auto" }}>
              {selectedTracks.map((track, idx) => (
                <div key={track.spotifyId || idx} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", borderBottom: idx < selectedTracks.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", paddingBottom: idx < selectedTracks.length - 1 ? "12px" : "0" }}>
                  <div style={{ fontSize: "12px", color: "#666666", fontWeight: "bold", width: "16px", textAlign: "center" }}>{idx + 1}</div>
                  {track.coverImg ? (
                    <img src={track.coverImg} alt="Album cover" style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#334155" }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: "0 0 2px 0", fontSize: "14px", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</h4>
                    <p style={{ margin: 0, fontSize: "12px", color: "#888888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <label style={{ display: "block", fontSize: "13px", color: "#888888", marginBottom: "8px", fontWeight: 600 }}>您的暱稱</label>
              <input
                type="text"
                value={userNickname}
                onChange={(e) => setUserNickname(e.target.value)}
                placeholder="例如：Alex"
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  color: "#ffffff",
                  fontSize: "15px",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#8b5cf6")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.1)")}
              />
            </div>

            <button
              onClick={finalizeOnboarding}
              disabled={isSyncProcessing}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "100px",
                border: "none",
                background: "linear-gradient(135deg, #1db954, #10b981)",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                cursor: isSyncProcessing ? "not-allowed" : "pointer",
                opacity: isSyncProcessing ? 0.7 : 1,
                transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
              }}
              onMouseEnter={(e) => {
                if (!isSyncProcessing) e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                if (!isSyncProcessing) e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {isSyncProcessing ? "處理中..." : "🚀 開始配對"}
            </button>
          </div>
        )}

        {errorNotification && (
          <p style={{ marginTop: "1rem", color: "#ef4444", fontSize: "13px", textAlign: "center", background: "rgba(239, 68, 68, 0.1)", padding: "10px", borderRadius: "8px" }}>
            {errorNotification}
          </p>
        )}
      </div>
    </div>
  );
}
