"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const { data: userSession, status: authStatus } = useSession();
  const navigation = useRouter();
  const [showDevLogin, setShowDevLogin] = useState(false);
  const [devEmail, setDevEmail] = useState("");

  useEffect(() => {
    if (authStatus === "authenticated") {
      navigation.push("/dashboard");
    }
  }, [authStatus, navigation]);

  if (authStatus === "loading" || authStatus === "authenticated") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-color)" }}></div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
        backgroundColor: "var(--bg-color)",
        position: "relative",
      }}
    >
      {/* Main Content Container */}
      <div
        style={{
          maxWidth: "400px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Title & Tagline */}
        <h1
          style={{
            fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
            fontSize: "3.5rem",
            fontWeight: 300,
            letterSpacing: "-0.05em",
            margin: "0 0 0.5rem 0",
            color: "var(--text-primary)",
          }}
        >
          μ(sic)
        </h1>
        <p
          style={{
            fontFamily: "var(--font-inter), sans-serif",
            fontSize: "0.95rem",
            fontWeight: 400,
            color: "var(--text-secondary)",
            margin: "0 0 4rem 0",
            letterSpacing: "0.02em",
          }}
        >
          Understand yourself through music.
        </p>

        {/* Separator / Divider */}
        <div
          style={{
            width: "60px",
            height: "1px",
            backgroundColor: "rgba(234, 229, 224, 0.15)",
            margin: "0 auto 3rem auto",
          }}
        />

        {/* Positioning Text */}
        <div
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontSize: "1.1rem",
            lineHeight: "1.7",
            fontWeight: 300,
            color: "var(--text-primary)",
            margin: "0 0 3.5rem 0",
            display: "flex",
            flexDirection: "column",
            gap: "1.2rem",
          }}
        >
          <p style={{ margin: 0 }}>
            Spotify records
            <br />
            <span style={{ color: "var(--text-secondary)" }}>what you listened to.</span>
          </p>
          <p style={{ margin: 0 }}>
            μ(sic) helps you understand
            <br />
            <span style={{ color: "var(--text-secondary)" }}>what it means.</span>
          </p>
        </div>

        {/* Separator / Divider */}
        <div
          style={{
            width: "60px",
            height: "1px",
            backgroundColor: "rgba(234, 229, 224, 0.15)",
            margin: "0 auto 3.5rem auto",
          }}
        />

        {/* Sign In Button */}
        <button
          onClick={() => signIn("spotify", { callbackUrl: "/dashboard" })}
          style={{
            padding: "1rem 2.5rem",
            borderRadius: "100px",
            border: "1px solid rgba(234, 229, 224, 0.15)",
            background: "transparent",
            color: "var(--text-primary)",
            fontSize: "0.9rem",
            fontWeight: 400,
            cursor: "pointer",
            transition: "all 0.3s ease",
            letterSpacing: "0.05em",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(234, 229, 224, 0.05)";
            e.currentTarget.style.borderColor = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "rgba(234, 229, 224, 0.15)";
          }}
        >
          Continue with Spotify
        </button>
      </div>

      {/* Subtle Developer Bypass (For offline/testing convenience) */}
      <div
        style={{
          position: "absolute",
          bottom: "1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <button
          onClick={() => setShowDevLogin(!showDevLogin)}
          style={{
            background: "none",
            border: "none",
            color: "rgba(234, 229, 224, 0.2)",
            fontSize: "0.75rem",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Developer Console
        </button>
        
        {showDevLogin && (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              background: "rgba(234, 229, 224, 0.02)",
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid rgba(234, 229, 224, 0.05)",
            }}
          >
            <input
              type="email"
              placeholder="demo@music.com"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              style={{
                background: "rgba(0, 0, 0, 0.2)",
                border: "1px solid rgba(234, 229, 224, 0.1)",
                borderRadius: "4px",
                padding: "0.25rem 0.5rem",
                color: "#ffffff",
                fontSize: "0.75rem",
                outline: "none",
              }}
            />
            <button
              onClick={() => signIn("test-login", { email: devEmail || "demo@music.com", callbackUrl: "/dashboard" })}
              style={{
                background: "rgba(234, 229, 224, 0.1)",
                border: "none",
                borderRadius: "4px",
                padding: "0.25rem 0.75rem",
                color: "#ffffff",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              Demo Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
