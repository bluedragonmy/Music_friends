"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Track {
  spotifyId?: string;
  title: string;
  artist: string;
  album: string;
  coverImg: string | null;
  duration: number;
  previewUrl: string | null;
  url?: string;
  startTime?: number;
  endTime?: number;
}

export default function PlaylistEditPage() {
  const { status } = useSession();
  const router = useRouter();

  const [currentTracks, setCurrentTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  const [recommendTracks, setRecommendTracks] = useState<Track[]>([]);
  const [loadingRecommend, setLoadingRecommend] = useState(false);
  const [showRecommend, setShowRecommend] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchMyPlaylist();
    }
  }, [status]);

  const fetchMyPlaylist = async () => {
    try {
      const res = await fetch("/api/playlists/mine");
      if (res.ok) {
        const data = await res.json();
        setCurrentTracks(data.tracks || []);
      }
    } catch (err) {
      console.error("Failed to fetch playlist", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setErrorMsg("");
    setIsTokenExpired(false);
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.error === "Spotify token expired") {
        setIsTokenExpired(true);
        throw new Error(data.error);
      }
      if (data.error) throw new Error(data.error);
      setSearchResults(data);
    } catch (err: any) {
      setErrorMsg("搜尋失敗：" + err.message);
    } finally {
      setSearching(false);
    }
  };

  const fetchRecommendTracks = async () => {
    setLoadingRecommend(true);
    setErrorMsg("");
    setIsTokenExpired(false);
    try {
      const res = await fetch("/api/spotify/top-tracks?limit=10");
      const data = await res.json();
      if (data.error === "Spotify token expired, please re-authenticate" || data.error === "Spotify account not linked or access token missing") {
        setIsTokenExpired(true);
        throw new Error("Spotify 授權失效，請重新授權。");
      }
      if (data.error) throw new Error(data.error);
      setRecommendTracks(data);
      setShowRecommend(true);
    } catch (err: any) {
      setErrorMsg("載入推薦歌曲失敗：" + err.message);
    } finally {
      setLoadingRecommend(false);
    }
  };

  const addTrack = (track: Track) => {
    if (currentTracks.length >= 5) {
      setErrorMsg("歌單最多只能包含 5 首歌曲！");
      // setTimeout 清除錯誤
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    // 避免重複加入
    if (currentTracks.some((t) => t.spotifyId === track.spotifyId)) {
      return;
    }
    const newTrack = {
      ...track,
      startTime: track.startTime !== undefined ? track.startTime : 0,
      endTime: track.endTime !== undefined ? track.endTime : 30
    };
    setCurrentTracks([...currentTracks, newTrack]);
  };

  const removeTrack = (indexToRemove: number) => {
    setCurrentTracks(currentTracks.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = async () => {
    if (currentTracks.length === 0) {
      setErrorMsg("歌單不能為空！");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/playlists/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: currentTracks }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // 儲存成功，回到 profile
      router.push("/profile");
    } catch (err: any) {
      setErrorMsg("儲存失敗：" + err.message);
      setSaving(false);
    }
  };

  if (status === "loading" || loading) return <div style={{ backgroundColor: "#050505", minHeight: "100vh" }} />;

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#050505",
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
      color: "#ffffff",
      fontFamily: "'Inter', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      overflow: "hidden"
    }}>
      {/* Top Bar */}
      <div style={{ width: "100%", maxWidth: "450px", padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>編輯歌單</h1>
          <p style={{ color: "#888", fontSize: "14px", margin: "4px 0 0 0" }}>打造專屬的音樂名片</p>
        </div>
        <Link href="/profile" style={{ color: "#888", textDecoration: "none", fontSize: "14px" }}>
          取消
        </Link>
      </div>

      <div style={{ flex: 1, width: "100%", maxWidth: "450px", overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {errorMsg && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#fca5a5", padding: "12px", borderRadius: "12px", fontSize: "14px", textAlign: "center", display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
            <span>{errorMsg}</span>
            {isTokenExpired && (
              <button
                onClick={() => {
                  window.location.href = "/api/spotify/auth?callbackUrl=/playlist/edit";
                }}
                style={{
                  padding: "8px 16px", borderRadius: "100px", border: "none",
                  background: "#1db954", color: "#fff", fontSize: "13px", fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                🔗 重新授權 Spotify
              </button>
            )}
          </div>
        )}

        {/* Current Tracks */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1db954" }}>已選歌曲 ({currentTracks.length}/5)</h3>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {currentTracks.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#666", background: "rgba(255,255,255,0.02)", borderRadius: "16px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                尚無歌曲，請透過下方推薦或搜尋加入
              </div>
            ) : (
              currentTracks.map((track, idx) => {
                const trackDuration = track.duration || 180;
                const maxStart = Math.max(0, trackDuration - 30);
                const startTime = track.startTime || 0;
                const endTime = track.endTime || 30;

                const formatTime = (secs: number) => {
                  const m = Math.floor(secs / 60);
                  const s = secs % 60;
                  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                };

                return (
                  <div key={track.spotifyId || idx} style={{ 
                    display: "flex", flexDirection: "column", gap: "12px", background: "rgba(255,255,255,0.03)", 
                    padding: "16px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.06)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {track.coverImg ? (
                        <img src={track.coverImg} alt="Cover" style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: "#334155" }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</h4>
                        <p style={{ margin: 0, fontSize: "13px", color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist}</p>
                      </div>
                      <button 
                        onClick={() => removeTrack(idx)}
                        style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "8px", fontSize: "20px" }}
                      >
                        ×
                      </button>
                    </div>

                    {/* 30秒精華區間調整 Slider */}
                    <div style={{ background: "rgba(0,0,0,0.25)", padding: "12px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "#aaa" }}>⚡ 自訂 30 秒精華起點</span>
                        <span style={{ color: "#1db954", fontWeight: "bold" }}>
                          {formatTime(startTime)} - {formatTime(endTime)}
                        </span>
                      </div>
                      <input 
                        type="range"
                        min={0}
                        max={maxStart}
                        value={startTime}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = [...currentTracks];
                          updated[idx] = {
                            ...updated[idx],
                            startTime: val,
                            endTime: val + 30
                          };
                          setCurrentTracks(updated);
                        }}
                        style={{
                          width: "100%",
                          accentColor: "#1db954",
                          cursor: "pointer",
                          height: "6px",
                          borderRadius: "3px"
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#666" }}>
                        <span>00:00</span>
                        <span>總長度 {formatTime(trackDuration)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", margin: "0" }} />

        {/* Recommend Import Section */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>常用歌曲推薦</h3>
            <button
              onClick={fetchRecommendTracks}
              disabled={loadingRecommend}
              style={{
                background: "rgba(29, 185, 84, 0.1)",
                border: "1px solid rgba(29, 185, 84, 0.2)",
                borderRadius: "100px",
                padding: "6px 16px",
                color: "#1db954",
                fontSize: "13px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "background 0.2s"
              }}
              onMouseEnter={e => { if(!loadingRecommend) e.currentTarget.style.background = "rgba(29, 185, 84, 0.18)" }}
              onMouseLeave={e => { if(!loadingRecommend) e.currentTarget.style.background = "rgba(29, 185, 84, 0.1)" }}
            >
              {loadingRecommend ? "載入中..." : "🎧 從 Spotify 匯入 Top 10"}
            </button>
          </div>

          {showRecommend && recommendTracks.length > 0 && (
            <div style={{ 
              background: "rgba(255, 255, 255, 0.02)", 
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "20px", 
              padding: "16px", 
              marginBottom: "16px",
              maxHeight: "260px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}>
              {recommendTracks.map((track, idx) => (
                <div key={track.spotifyId || idx} style={{ 
                  display: "flex", alignItems: "center", gap: "12px", padding: "8px", borderRadius: "12px",
                  transition: "background 0.2s"
                }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  {track.coverImg ? (
                    <img src={track.coverImg} alt="Cover" style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#334155" }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: "0 0 2px 0", fontSize: "14px", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</h4>
                    <p style={{ margin: 0, fontSize: "12px", color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist}</p>
                  </div>
                  <button 
                    onClick={() => addTrack(track)}
                    disabled={currentTracks.length >= 5 || currentTracks.some(t => t.spotifyId === track.spotifyId)}
                    style={{ 
                      padding: "6px 12px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.2)",
                      background: currentTracks.some(t => t.spotifyId === track.spotifyId) ? "rgba(255,255,255,0.1)" : "transparent", 
                      color: currentTracks.some(t => t.spotifyId === track.spotifyId) ? "#888" : "#fff", 
                      fontSize: "12px", cursor: currentTracks.some(t => t.spotifyId === track.spotifyId) ? "default" : "pointer"
                    }}
                  >
                    {currentTracks.some(t => t.spotifyId === track.spotifyId) ? "已加入" : "+ 加入"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", margin: "0" }} />

        {/* Search Section */}
        <div>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: 700 }}>搜尋歌曲</h3>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <input 
              type="text" 
              placeholder="搜尋歌名或歌手..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1, padding: "12px 16px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)", color: "#fff", outline: "none", fontSize: "14px"
              }}
            />
            <button 
              type="submit"
              disabled={searching || !searchQuery.trim()}
              style={{
                padding: "0 24px", borderRadius: "100px", border: "none", background: "#1db954", color: "#fff",
                fontWeight: "bold", cursor: searching || !searchQuery.trim() ? "not-allowed" : "pointer", opacity: searching || !searchQuery.trim() ? 0.5 : 1
              }}
            >
              {searching ? "..." : "搜尋"}
            </button>
          </form>

          {/* Search Results */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "350px", overflowY: "auto", paddingRight: "4px" }}>
            {searchResults.map((track, idx) => (
              <div key={track.spotifyId || idx} style={{ 
                display: "flex", alignItems: "center", gap: "12px", padding: "8px", borderRadius: "12px",
                transition: "background 0.2s"
              }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {track.coverImg ? (
                  <img src={track.coverImg} alt="Cover" style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#334155" }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: "0 0 2px 0", fontSize: "14px", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist}</p>
                </div>
                <button 
                  onClick={() => addTrack(track)}
                  disabled={currentTracks.length >= 5 || currentTracks.some(t => t.spotifyId === track.spotifyId)}
                  style={{ 
                    padding: "6px 12px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.2)",
                    background: currentTracks.some(t => t.spotifyId === track.spotifyId) ? "rgba(255,255,255,0.1)" : "transparent", 
                    color: currentTracks.some(t => t.spotifyId === track.spotifyId) ? "#888" : "#fff", 
                    fontSize: "12px", cursor: currentTracks.some(t => t.spotifyId === track.spotifyId) ? "default" : "pointer"
                  }}
                >
                  {currentTracks.some(t => t.spotifyId === track.spotifyId) ? "已加入" : "+ 加入"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Save Button */}
      <div style={{
        width: "100%", maxWidth: "450px", padding: "16px 20px", display: "flex", justifyContent: "center",
        borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(5, 5, 5, 0.9)", backdropFilter: "blur(20px)"
      }}>
        <button
          onClick={handleSave}
          disabled={saving || currentTracks.length === 0}
          style={{
            width: "100%", padding: "16px", borderRadius: "100px", border: "none",
            background: "linear-gradient(135deg, #1db954, #10b981)", color: "#fff", fontSize: "15px", fontWeight: 700,
            cursor: saving || currentTracks.length === 0 ? "not-allowed" : "pointer", opacity: saving || currentTracks.length === 0 ? 0.5 : 1,
            boxShadow: "0 4px 14px rgba(29, 185, 84, 0.3)"
          }}
        >
          {saving ? "儲存中..." : "儲存並套用歌單"}
        </button>
      </div>
    </div>
  );
}
