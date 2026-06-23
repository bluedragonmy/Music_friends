"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const { data: userSession, status: authStatus } = useSession();
  const navigation = useRouter();
  const queryParams = useSearchParams();
  const [loginError, setLoginError] = useState("");
  const [developerEmail, setDeveloperEmail] = useState("");

  useEffect(() => {
    const errorType = queryParams.get("error");
    if (errorType === "Configuration") {
      setLoginError("登入服務設定遺失 (請檢查 .env 中的 Client ID)");
    } else if (errorType === "AccessDenied") {
      setLoginError("存取被拒");
    } else if (errorType === "session_expired") {
      setLoginError("您的登入狀態已過期，請重新登入");
    } else if (errorType) {
      setLoginError(`登入失敗: ${errorType}`);
    }
  }, [queryParams]);

  useEffect(() => {
    // Avoid redirect loops if there is an active error param
    if (authStatus === "authenticated" && !queryParams.get("error")) {
      navigation.push("/");
    }
  }, [authStatus, navigation, queryParams]);

  if (authStatus === "loading") {
    return <div style={{ minHeight: "100vh", backgroundColor: "#050505" }}></div>;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050505",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`,
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
          alignItems: "center",
          boxShadow: "0 40px 80px -20px rgba(0, 0, 0, 0.8)",
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Decorative note logo */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1db954, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            marginBottom: "1.5rem",
            boxShadow: "0 10px 20px rgba(0,0,0,0.5)",
          }}
        >
          🎵
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>Ditto</h1>
        <p style={{ color: "#888888", fontSize: "14px", margin: "0 0 2rem 0", lineHeight: "1.5" }}>
          建立你的音樂人格<br />尋找心靈共鳴的那個他
        </p>

        {loginError && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              color: "#fca5a5",
              padding: "10px",
              borderRadius: "12px",
              fontSize: "13px",
              marginBottom: "1.5rem",
              width: "100%",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            {loginError}
          </div>
        )}

        <button
          onClick={() => signIn("spotify", { callbackUrl: "/" })}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "100px",
            border: "none",
            background: "#1db954",
            color: "#ffffff",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "1rem",
            transition: "transform 0.2s, background 0.2s",
            boxShadow: "0 4px 14px rgba(29, 185, 84, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.02)";
            e.currentTarget.style.background = "#1ed760";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.background = "#1db954";
          }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.56.3z" />
          </svg>
          使用 Spotify 登入
        </button>

        {/* Development fast log in */}
        <div style={{ marginTop: "1rem", width: "100%", borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "1.5rem" }}>
          <p style={{ fontSize: "12px", color: "#888888", marginBottom: "8px" }}>開發模式：直接使用 Email 登入測試</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="email"
              placeholder="輸入任意 test email"
              value={developerEmail}
              onChange={(e) => setDeveloperEmail(e.target.value)}
              style={{
                flex: 1,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "100px",
                padding: "0 16px",
                color: "#ffffff",
                outline: "none",
                fontSize: "13px",
              }}
            />
            <button
              onClick={() => signIn("test-login", { email: developerEmail || "demo@vibe.com", callbackUrl: "/" })}
              style={{
                padding: "12px 16px",
                borderRadius: "100px",
                background: "#8b5cf6",
                border: "none",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              測試登入
            </button>
          </div>
        </div>

        {/* Bypassing route button */}
        <div style={{ marginTop: "1.5rem", width: "100%", textAlign: "center" }}>
          <button
            onClick={() => navigation.push("/match")}
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: "1px solid #1db954",
              color: "#1db954",
              borderRadius: "100px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(29, 185, 84, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            👀 純 UI 展示 (跳過登入直接看畫面)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#050505" }}></div>}>
      <LoginContent />
    </Suspense>
  );
}
