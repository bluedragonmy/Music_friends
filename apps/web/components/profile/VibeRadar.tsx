"use client";

import React from "react";

interface VibeRadarProps {
  energy: number;
  danceability: number;
  valence: number;
}

export default function VibeRadar({ energy, danceability, valence }: VibeRadarProps) {
  const cx = 150;
  const cy = 150;
  const maxR = 100;

  const a1 = -Math.PI / 2;
  const a2 = Math.PI / 6;
  const a3 = (5 * Math.PI) / 6;

  const getPoint = (val: number, angle: number) => {
    return `${cx + maxR * val * Math.cos(angle)},${cy + maxR * val * Math.sin(angle)}`;
  };

  // 避免值太小導致圖形擠在一起，設定個最小值 0.1
  const e = Math.max(0.1, energy);
  const d = Math.max(0.1, danceability);
  const v = Math.max(0.1, valence);

  const dataPolygon = `${getPoint(e, a1)} ${getPoint(d, a2)} ${getPoint(v, a3)}`;

  // 畫出背景的多邊形網格
  const levels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <svg width="300" height="300" viewBox="0 0 300 300">
        <defs>
          <linearGradient id="vibeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1db954" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 網格背景 */}
        {levels.map((lvl) => {
          const pts = `${getPoint(lvl, a1)} ${getPoint(lvl, a2)} ${getPoint(lvl, a3)}`;
          return (
            <polygon
              key={lvl}
              points={pts}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* 座標軸線 */}
        <line x1={cx} y1={cy} x2={cx + maxR * Math.cos(a1)} y2={cy + maxR * Math.sin(a1)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1={cx} y1={cy} x2={cx + maxR * Math.cos(a2)} y2={cy + maxR * Math.sin(a2)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1={cx} y1={cy} x2={cx + maxR * Math.cos(a3)} y2={cy + maxR * Math.sin(a3)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

        {/* 資料多邊形 */}
        <polygon
          points={dataPolygon}
          fill="url(#vibeGradient)"
          stroke="#fff"
          strokeWidth="2"
          filter="url(#glow)"
        />

        {/* 資料點 */}
        <circle cx={cx + maxR * e * Math.cos(a1)} cy={cy + maxR * e * Math.sin(a1)} r="4" fill="#fff" />
        <circle cx={cx + maxR * d * Math.cos(a2)} cy={cy + maxR * d * Math.sin(a2)} r="4" fill="#fff" />
        <circle cx={cx + maxR * v * Math.cos(a3)} cy={cy + maxR * v * Math.sin(a3)} r="4" fill="#fff" />

        {/* 標籤文字 */}
        <text x={cx + maxR * 1.25 * Math.cos(a1)} y={cy + maxR * 1.2 * Math.sin(a1) + 4} fill="#fff" fontSize="13" fontWeight="bold" textAnchor="middle">
          Energy {Math.round(e * 100)}%
        </text>
        <text x={cx + maxR * 1.25 * Math.cos(a2)} y={cy + maxR * 1.25 * Math.sin(a2) + 4} fill="#fff" fontSize="13" fontWeight="bold" textAnchor="middle">
          Danceability {Math.round(d * 100)}%
        </text>
        <text x={cx + maxR * 1.25 * Math.cos(a3)} y={cy + maxR * 1.25 * Math.sin(a3) + 4} fill="#fff" fontSize="13" fontWeight="bold" textAnchor="middle">
          Valence {Math.round(v * 100)}%
        </text>
      </svg>
    </div>
  );
}
