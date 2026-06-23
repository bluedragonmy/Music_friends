"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Disc3, MessageCircle, User } from "lucide-react";
import DeckContainer from "@/components/matching/DeckContainer";
import { Candidate } from "@/components/matching/MatchCard";

export default function HomePage() {
  const { data: userSession, status: authStatus } = useSession();
  const navigation = useRouter();

  const [candidateQueue, setCandidateQueue] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Recommendations mode: random (default) vs similar
  const [recommendationMode, setRecommendationMode] = useState<"random" | "similar">("random");

  // Dynamic backdrops using dual layers
  const [primaryBgColor, setPrimaryBgColor] = useState("#050505");
  const [secondaryBgColor, setSecondaryBgColor] = useState("#050505");
  const [toggleBgFade, setToggleBgFade] = useState(true);
  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      navigation.push("/login");
    }
  }, [authStatus, navigation]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      loadProfiles();
    }
  }, [authStatus, recommendationMode]);

  // Adjust theme backdrop based on current top card's active color
  useEffect(() => {
    if (candidateQueue.length > 0 && currentIndex < candidateQueue.length) {
      const topProfile = candidateQueue[currentIndex];
      const targetColor = topProfile?.tracks?.[0]?.dominantColor || "#050505";

      if (targetColor !== primaryBgColor) {
        setSecondaryBgColor(primaryBgColor);
        setPrimaryBgColor(targetColor);
        setToggleBgFade((prev) => !prev);
      }
    } else {
      if (primaryBgColor !== "#050505") {
        setSecondaryBgColor(primaryBgColor);
        setPrimaryBgColor("#050505");
        setToggleBgFade((prev) => !prev);
      }
    }
  }, [candidateQueue, currentIndex, primaryBgColor]);

  const toggleMode = (modeSelected: "random" | "similar") => {
    if (modeSelected === recommendationMode) return;
    setCandidateQueue([]);
    setRecommendationMode(modeSelected);
  };

  const loadProfiles = async () => {
    setIsDataLoading(true);
    try {
      const queryUrl = `/api/match/candidates?mode=${recommendationMode}`;
      const response = await fetch(queryUrl);

      if (response.status === 401 || response.status === 404) {
        await signOut({ redirect: false });
        window.location.href = "/login?error=session_expired";
        return;
      }

      // Check if user requires onboarding setup
      if (response.status === 400) {
        const payload = await response.json();
        if (payload.needsOnboarding) {
          navigation.push("/onboarding");
          return;
        }
      }

      const payload = await response.json();
      if (payload.error) throw new Error(payload.error);

      const items = payload.candidates || [];
      const formattedItems = items.map((item: any): Candidate & { original: any } => {
        const musicList = item.playlists?.[0]?.tracks?.map((t: any, idx: number) => ({
          id: `t-${idx}`,
          spotifyId: t.track.spotifyId,
          title: t.track.title,
          artist: t.track.artist,
          coverUrl: t.track.coverImg,
          previewUrl: t.track.previewUrl || undefined,
          dominantColor: t.track.dominantColor,
          startTime: t.startTime || 0,
          endTime: t.endTime || 30,
        })) || [];

        return {
          id: item.id,
          name: item.name || item.email?.split("@")[0] || "User",
          matchScore: 90,
          tracks: musicList.length > 0 ? musicList : [
            {
              id: "placeholder",
              title: "No Tracks Added",
              artist: "Unknown",
              coverUrl: item.image || "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
            },
          ],
          original: item,
        };
      });

      setCandidateQueue(formattedItems);
      setCurrentIndex(0);
    } catch (err: any) {
      console.error("Failed loading candidate profiles:", err);
      setErrorMessage(err.message);
    } finally {
      setIsDataLoading(false);
    }
  };

  const preloadAdditionalProfiles = async (existingList: any[]) => {
    if (isPreloading) return;
    setIsPreloading(true);
    try {
      const skipIds = existingList.map((c) => c.id).join(",");
      const response = await fetch(`/api/match/candidates?mode=${recommendationMode}&exclude=${skipIds}`);

      if (response.ok) {
        const payload = await response.json();
        const items = payload.candidates || [];
        const formattedItems = items.map((item: any): Candidate & { original: any } => {
          const musicList = item.playlists?.[0]?.tracks?.map((t: any, idx: number) => ({
            id: `t-${idx}`,
            spotifyId: t.track.spotifyId,
            title: t.track.title,
            artist: t.track.artist,
            coverUrl: t.track.coverImg,
            previewUrl: t.track.previewUrl || undefined,
            dominantColor: t.track.dominantColor,
            startTime: t.startTime || 0,
            endTime: t.endTime || 30,
          })) || [];

          return {
            id: item.id,
            name: item.name || item.email?.split("@")[0] || "User",
            matchScore: 90,
            tracks: musicList.length > 0 ? musicList : [
              {
                id: "placeholder",
                title: "No Tracks Added",
                artist: "Unknown",
                coverUrl: item.image || "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
              },
            ],
            original: item,
          };
        });

        if (formattedItems.length > 0) {
          setCandidateQueue((prev) => [...prev, ...formattedItems]);
        }
      }
    } catch (err) {
      console.error("Failed preloading additional profiles:", err);
    } finally {
      setIsPreloading(false);
    }
  };

  const recordSwipeAction = async (targetUserId: string, actionType: "LIKE" | "SKIP") => {
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);

    // Trigger preload when remaining profiles drop below 3
    if (candidateQueue.length - nextIdx <= 3) {
      preloadAdditionalProfiles(candidateQueue.slice(nextIdx));
    }

    try {
      const response = await fetch("/api/match/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action: actionType }),
      });

      if (response.status === 401 || response.status === 404) {
        await signOut({ redirect: false });
        window.location.href = "/login?error=session_expired";
        return;
      }

      const payload = await response.json();
      if (payload.isMatch) {
        const matchPartner = candidateQueue.find((c) => c.id === targetUserId);
        setActiveMatch({
          partner: matchPartner?.original || matchPartner,
          roomId: payload.roomId,
        });
      }
    } catch (err) {
      console.error("Failed recording swipe action:", err);
    }
  };

  const currentMatchTarget = candidateQueue[currentIndex];

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        color: "#ffffff",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: "#050505",
      }}
    >
      {/* Background Glow Layer 1 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          backgroundImage: `radial-gradient(circle at 50% 30%, ${primaryBgColor}1a 0%, #050505 80%)`,
          opacity: toggleBgFade ? 1 : 0,
          transition: "opacity 1.2s cubic-bezier(0.25, 0.8, 0.25, 1)",
          pointerEvents: "none",
        }}
      />

      {/* Background Glow Layer 2 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          backgroundImage: `radial-gradient(circle at 50% 30%, ${secondaryBgColor}1a 0%, #050505 80%)`,
          opacity: toggleBgFade ? 0 : 1,
          transition: "opacity 1.2s cubic-bezier(0.25, 0.8, 0.25, 1)",
          pointerEvents: "none",
        }}
      />

      {/* Grain / Noise Filter */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E")`,
          pointerEvents: "none",
        }}
      />

      {/* Navigation Header */}
      <div style={{ zIndex: 10, width: "100%", maxWidth: "450px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 800, margin: 0, background: "linear-gradient(135deg, #ffffff 60%, #9e9e9e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Ditto</h1>

        {/* Algorithm Preference Controller */}
        <div
          style={{
            display: "flex",
            background: "rgba(255, 255, 255, 0.03)",
            padding: "2px",
            borderRadius: "100px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            gap: "2px",
          }}
        >
          <button
            onClick={() => toggleMode("random")}
            style={{
              padding: "4px 12px",
              borderRadius: "100px",
              border: "none",
              background: recommendationMode === "random" ? "rgba(255, 255, 255, 0.08)" : "transparent",
              color: recommendationMode === "random" ? "#ffffff" : "#777777",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            隨機
          </button>
          <button
            onClick={() => toggleMode("similar")}
            style={{
              padding: "4px 12px",
              borderRadius: "100px",
              border: "none",
              background: recommendationMode === "similar" ? "rgba(255, 255, 255, 0.08)" : "transparent",
              color: recommendationMode === "similar" ? "#ffffff" : "#777777",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            音樂共鳴
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {process.env.NODE_ENV === "development" && (
            <button
              onClick={() => setActiveMatch({ partner: currentMatchTarget, roomId: "mock-room" })}
              style={{ color: "#ffffff", background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.3)", fontSize: "11px", padding: "4px 10px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
            >
              測試配對
            </button>
          )}
          <Link href="/dev-dash" style={{ color: "#777777", textDecoration: "none", fontSize: "11px", border: "1px solid rgba(255,255,255,0.08)", padding: "4px 8px", borderRadius: "8px", fontWeight: 700 }}>
            Dev
          </Link>
        </div>
      </div>

      {/* Main deck area */}
      <div style={{ zIndex: 5, flex: 1, width: "100%", maxWidth: "450px", position: "relative", display: "flex", flexDirection: "column" }}>
        <DeckContainer
          candidatesList={candidateQueue.slice(currentIndex)}
          isSearching={isDataLoading}
          onSwipePerform={recordSwipeAction}
        />
      </div>

      {/* Bottom Nav Bar */}
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(5, 5, 5, 0.8)",
          backdropFilter: "blur(20px)",
        }}
      >
        <Link href="/" style={{ color: "#ffffff", textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Disc3 size={28} />
        </Link>
        <Link href="/chat" style={{ color: "#888888", textDecoration: "none", display: "flex", alignItems: "center" }}>
          <MessageCircle size={28} />
        </Link>
        <Link href="/profile" style={{ color: "#888888", textDecoration: "none", display: "flex", alignItems: "center" }}>
          <User size={28} />
        </Link>
      </div>

      {/* Match success popup overlay */}
      {activeMatch && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(5, 5, 5, 0.95)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            backdropFilter: "blur(15px)",
          }}
        >
          <h1 style={{ fontSize: "38px", fontWeight: 800, background: "linear-gradient(135deg, #10b981, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "40px" }}>
            配對成功
          </h1>
          <div style={{ display: "flex", gap: "-20px", marginBottom: "40px" }}>
            <div style={{ width: "96px", height: "96px", borderRadius: "50%", border: "4px solid #050505", background: "#333", backgroundImage: `url(${userSession?.user?.image})`, backgroundSize: "cover", zIndex: 2 }}></div>
            <div style={{ width: "96px", height: "96px", borderRadius: "50%", border: "4px solid #050505", background: "#444", backgroundImage: `url(${activeMatch.partner?.image})`, backgroundSize: "cover", transform: "translateX(-20px)", zIndex: 1 }}></div>
          </div>
          <p style={{ color: "#9e9e9e", marginBottom: "40px" }}>你與 {activeMatch.partner?.name || activeMatch.partner?.email?.split("@")[0]} 產生了共鳴</p>
          <button
            onClick={() => navigation.push(`/chat/${activeMatch.roomId}`)}
            style={{ padding: "16px 32px", borderRadius: "100px", border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "#ffffff", fontSize: "16px", fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 20px rgba(16, 185, 129, 0.35)" }}
          >
            前往聊天室
          </button>
          <button
            onClick={() => setActiveMatch(null)}
            style={{ marginTop: "16px", padding: "12px 24px", background: "transparent", border: "none", color: "#888888", fontSize: "14px", cursor: "pointer" }}
          >
            繼續探索
          </button>
        </div>
      )}
    </div>
  );
}
