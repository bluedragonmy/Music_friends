"use client";

import React, { useMemo } from "react";

interface Track {
  id: string;
  title: string;
  artist: string;
  coverImg: string | null;
  dominantColor: string | null;
  genres: string | null;
  count: number;
}

interface Genre {
  name: string;
  count: number;
}

interface MusicMindMapProps {
  userImage: string | null | undefined;
  userName: string | null | undefined;
  topGenres: Genre[];
  topTracks: Track[];
}

const MOCK_GENRES: Genre[] = [
  { name: "Dream Pop", count: 12 },
  { name: "Shoegaze", count: 9 },
  { name: "Lo-Fi", count: 7 },
  { name: "Ambient", count: 5 },
  { name: "Synthwave", count: 3 }
];

const MOCK_TRACKS: Track[] = [
  { id: "mock-1", title: "Space Song", artist: "Beach House", coverImg: null, dominantColor: "#8b5cf6", genres: "dream pop", count: 8 },
  { id: "mock-2", title: "Cherry-coloured Funk", artist: "Cocteau Twins", coverImg: null, dominantColor: "#ec4899", genres: "shoegaze", count: 6 },
  { id: "mock-3", title: "Fade Into You", artist: "Mazzy Star", coverImg: null, dominantColor: "#0ea5e9", genres: "dream pop", count: 5 },
  { id: "mock-4", title: "Intro", artist: "The xx", coverImg: null, dominantColor: "#1db954", genres: "ambient", count: 4 },
  { id: "mock-5", title: "Resonance", artist: "Home", coverImg: null, dominantColor: "#f59e0b", genres: "synthwave", count: 3 }
];

export default function MusicMindMap({ userImage, userName, topGenres, topTracks }: MusicMindMapProps) {
  const width = 400;
  const height = 360;
  const cx = width / 2;
  const cy = height / 2;

  // 安全防禦
  const safeGenres = Array.isArray(topGenres) ? topGenres : [];
  const safeTracks = Array.isArray(topTracks) ? topTracks : [];
  const isDemo = safeGenres.length === 0 || safeTracks.length === 0;

  const activeGenres = isDemo ? MOCK_GENRES : safeGenres;
  const activeTracks = isDemo ? MOCK_TRACKS : safeTracks;

  const genres = useMemo(() => activeGenres.slice(0, 5), [activeGenres]);
  const maxCount = useMemo(() => Math.max(...genres.map(g => g.count), 1), [genres]);

  // 1. 同心聲波環路徑
  const waveRings = useMemo(() => {
    return genres.map((g, idx) => {
      const baseRadius = 60 + idx * 24; // 每圈間隔 24px
      const amplitude = 4 + (g.count / maxCount) * 8; // 波幅
      const freq = 6 + idx; // 聲波頻率不同
      const themeColor = [
        "#1db954", // 亮綠
        "#8b5cf6", // 紫
        "#ec4899", // 粉紅
        "#0ea5e9", // 天藍
        "#f59e0b"  // 橘黃
      ][idx % 5];

      // 生成 SVG path (120等分點)
      const points: string[] = [];
      const steps = 120;
      for (let i = 0; i <= steps; i++) {
        const theta = (i * 2 * Math.PI) / steps;
        const r = baseRadius + amplitude * Math.sin(freq * theta);
        const x = cx + r * Math.cos(theta);
        const y = cy + r * Math.sin(theta);
        points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
      }
      points.push("Z");

      // 曲風標籤座標
      const labelAngle = (idx * 2 * Math.PI) / 5 - Math.PI / 2;
      const labelR = baseRadius + amplitude * Math.sin(freq * labelAngle);
      const labelX = cx + labelR * Math.cos(labelAngle);
      const labelY = cy + labelR * Math.sin(labelAngle);

      return {
        name: g.name,
        path: points.join(" "),
        themeColor,
        labelX,
        labelY,
        baseRadius,
        amplitude,
        freq
      };
    });
  }, [genres, maxCount, cx, cy]);

  // 2. 歌曲粒子 (靜態座標計算，固定在對應軌道上)
  const trackParticles = useMemo(() => {
    return activeTracks.slice(0, 5).map((track, idx) => {
      let ringIdx = idx % waveRings.length;
      if (track.genres) {
        const trackGenresList = track.genres.split(", ").map(t => t.toLowerCase().trim());
        for (let i = 0; i < waveRings.length; i++) {
          const gName = waveRings[i].name.toLowerCase();
          if (trackGenresList.includes(gName)) {
            ringIdx = i;
            break;
          }
        }
      }

      const ring = waveRings[ringIdx];
      // 五首歌曲分別擺放在 45°, 117°, 189°, 261°, 333° 靜態角度，錯開標籤
      const angle = ((idx * 72 + 45) * Math.PI) / 180;
      const particleR = ring.baseRadius + ring.amplitude * Math.sin(ring.freq * angle);
      const x = cx + particleR * Math.cos(angle);
      const y = cy + particleR * Math.sin(angle);

      return {
        track,
        ring,
        x,
        y,
        color: track.dominantColor || ring.themeColor
      };
    });
  }, [activeTracks, waveRings, cx, cy]);

  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.01)",
      borderRadius: "28px",
      padding: "24px 20px",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
      overflow: "hidden",
      width: "100%",
      backdropFilter: "blur(20px)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
      minHeight: `${height + 70}px`
    }}>
      {/* Header */}
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", zIndex: 10 }}>
        <h4 style={{ margin: 0, fontSize: "11px", fontWeight: 900, color: "#1db954", letterSpacing: "2.5px", textShadow: "0 0 8px rgba(29, 185, 84, 0.3)" }}>
          TASTE AUDIO SPECTRUM {`{品味聲波頻譜}`}
        </h4>
        {isDemo && (
          <span style={{
            fontSize: "10px",
            color: "#8b5cf6",
            background: "rgba(139, 92, 246, 0.12)",
            padding: "2px 10px",
            borderRadius: "100px",
            fontWeight: "bold",
            letterSpacing: "0.5px",
            border: "1px solid rgba(139, 92, 246, 0.2)"
          }}>
            DEMO
          </span>
        )}
      </div>

      <svg 
        width="100%" 
        height={height} 
        viewBox={`0 0 ${width} ${height}`} 
        style={{ overflow: "visible", maxWidth: `${width}px`, zIndex: 10 }}
      >
        <defs>
          <filter id="glowFilt" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="avatarGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <clipPath id="avatarCircleClip">
            <circle cx="0" cy="0" r="23" />
          </clipPath>

          <linearGradient id="avatarGradBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1db954" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>

        {/* ─── 1. 輔助同心背景線圈 ─── */}
        <circle cx={cx} cy={cy} r="150" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r="100" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />

        {/* ─── 2. 繪製 5 大同心霓虹聲波環 ─── */}
        {waveRings.map((ring, idx) => (
          <g key={`ring-${idx}`}>
            {/* 霓虹發光描邊 */}
            <path
              d={ring.path}
              fill="none"
              stroke={ring.themeColor}
              strokeWidth="2.2"
              opacity="0.12"
              filter="url(#glowFilt)"
            />
            {/* 極細實體聲波線 */}
            <path
              d={ring.path}
              fill="none"
              stroke={ring.themeColor}
              strokeWidth="1.2"
              opacity="0.85"
            />
          </g>
        ))}

        {/* ─── 3. 歌曲發光粒子 (靜態定位) ─── */}
        {trackParticles.map((part, idx) => (
          <g key={`part-${idx}`}>
            <circle
              cx={part.x}
              cy={part.y}
              r="5"
              fill="#ffffff"
              stroke={part.color}
              strokeWidth="2.2"
              filter="url(#glowFilt)"
              opacity="0.95"
            />
          </g>
        ))}

        {/* ─── 4. 曲風標籤 (膠囊底板 + 英文大寫) ─── */}
        {waveRings.map((ring, idx) => (
          <g key={`label-${idx}`} transform={`translate(${ring.labelX}, ${ring.labelY})`}>
            <rect
              x="-42"
              y="-10"
              width="84"
              height="20"
              rx="10"
              fill="#060608"
              stroke={ring.themeColor}
              strokeWidth="1"
              opacity="0.9"
            />
            <text
              textAnchor="middle"
              y="3.5"
              fill="#ffffff"
              fontSize="9px"
              fontWeight="900"
              style={{
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "0.8px"
              }}
            >
              {ring.name.toUpperCase()}
            </text>
          </g>
        ))}

        {/* ─── 5. 中心黑膠唱片頭像 (靜態) ─── */}
        <g transform={`translate(${cx}, ${cy})`}>
          {/* 彩虹外圈發光 */}
          <circle r="28" fill="none" stroke="url(#avatarGradBorder)" strokeWidth="3" filter="url(#avatarGlow)" opacity="0.65" />
          
          {/* 唱片盤面 */}
          <g>
            <circle r="26" fill="#08080a" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <circle r="24" fill="none" stroke="url(#avatarGradBorder)" strokeWidth="2" />
            
            {/* 唱片螺紋線 */}
            <circle r="18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
            <circle r="12" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />

            {/* 用戶頭像 */}
            {userImage ? (
              <image
                href={userImage}
                x="-23"
                y="-23"
                width="46"
                height="46"
                clipPath="url(#avatarCircleClip)"
              />
            ) : (
              <circle r="23" fill="#18181c" />
            )}

            {!userImage && (
              <text
                y="5"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="12px"
                fontWeight="900"
                style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
              >
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </text>
            )}
          </g>
        </g>
      </svg>
    </div>
  );
}
