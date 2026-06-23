"use client";

import React, { useRef, useEffect, useState } from "react";
import { X, Download, ShieldAlert, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Track {
  id: string;
  title: string;
  artist: string;
  coverImg: string | null;
  dominantColor: string | null;
  count: number;
  genres?: string | null;
}

interface Genre {
  name: string;
  count: number;
}

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userImage: string | null | undefined;
  userName: string | null | undefined;
  dimension: string;
  dimensionDurationMs: number;
  topGenres: Genre[];
  topTracks: Track[];
}

export default function ShareCardModal({
  isOpen,
  onClose,
  userImage,
  userName,
  dimension,
  dimensionDurationMs,
  topGenres = [],
  topTracks = []
}: ShareCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [cardImgSrc, setCardImgSrc] = useState<string | null>(null);
  const [downloadHovered, setDownloadHovered] = useState(false);
  const [closeHovered, setCloseHovered] = useState(false);

  const dimensionName = {
    day: "單日",
    week: "本週",
    month: "本月",
    quarter: "本季",
    year: "年度"
  }[dimension] || "專屬";

  const formatDuration = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours} 小時 ${mins % 60} 分鐘`;
    return `${mins} 分鐘`;
  };

  useEffect(() => {
    if (!isOpen) {
      setRendered(false);
      setCardImgSrc(null);
      return;
    }

    // 當彈窗打開時，使用 Canvas 繪製分享圖卡
    const timer = setTimeout(() => {
      drawShareCard();
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const drawShareCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 設定畫布解析度 (1000x1100px, 適合社群分享與長圖發布)
    const W = 1000;
    const H = 1100;
    canvas.width = W;
    canvas.height = H;

    // 1. 繪製深邃漸層背景
    ctx.fillStyle = "#070708";
    ctx.fillRect(0, 0, W, H);

    // 2. 繪製彩色霓虹光暈 (漸層)
    // 左上紫色光暈
    const purpleGrad = ctx.createRadialGradient(200, 200, 50, 250, 250, 550);
    purpleGrad.addColorStop(0, "rgba(139, 92, 246, 0.25)");
    purpleGrad.addColorStop(1, "rgba(7, 7, 8, 0)");
    ctx.fillStyle = purpleGrad;
    ctx.fillRect(0, 0, W, H);

    // 右中綠色光暈 (對準心智圖區域)
    const greenGrad = ctx.createRadialGradient(800, 700, 50, 750, 700, 550);
    greenGrad.addColorStop(0, "rgba(29, 185, 84, 0.22)");
    greenGrad.addColorStop(1, "rgba(7, 7, 8, 0)");
    ctx.fillStyle = greenGrad;
    ctx.fillRect(0, 0, W, H);

    // 中下粉橘色微弱光暈
    const orangeGrad = ctx.createRadialGradient(500, 1000, 10, 500, 1000, 450);
    orangeGrad.addColorStop(0, "rgba(245, 158, 11, 0.1)");
    orangeGrad.addColorStop(1, "rgba(7, 7, 8, 0)");
    ctx.fillStyle = orangeGrad;
    ctx.fillRect(0, 0, W, H);

    // 3. 繪製 Glassmorphism 卡片主體 (置中圓角矩形)
    const cardX = 60;
    const cardY = 60;
    const cardW = W - 120;
    const cardH = H - 120;
    const cardR = 32;

    ctx.save();
    // 繪製圓角矩形路徑
    ctx.beginPath();
    ctx.moveTo(cardX + cardR, cardY);
    ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, cardR);
    ctx.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, cardR);
    ctx.arcTo(cardX, cardY + cardH, cardX, cardY, cardR);
    ctx.arcTo(cardX, cardY, cardX + cardW, cardY, cardR);
    ctx.closePath();

    // 填滿半透明磨砂玻璃色
    ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
    ctx.fill();

    // 繪製極細邊框
    const borderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    borderGrad.addColorStop(0, "rgba(255, 255, 255, 0.15)");
    borderGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.03)");
    borderGrad.addColorStop(1, "rgba(139, 92, 246, 0.2)");
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 4. 繪製 LOGO {商標} 與標題 (字體放大)
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 30px 'Inter', sans-serif";
    ctx.fillText("DITTO", cardX + 40, cardY + 65);

    ctx.fillStyle = "#888888";
    ctx.font = "500 16px 'Inter', sans-serif";
    ctx.fillText("音樂品味限時交流 APP", cardX + 150, cardY + 62);

    // 5. 繪製用戶個人資料 (右上角)
    const userTextX = cardX + cardW - 40;
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px 'Inter', sans-serif";
    ctx.fillText(userName || "Ditto User", userTextX, cardY + 58);

    ctx.fillStyle = "rgba(29, 185, 84, 0.85)";
    ctx.font = "bold 15px 'Inter', sans-serif";
    ctx.fillText("已連結 SPOTIFY", userTextX, cardY + 80);

    // 6. 繪製主卡片標題 (極致大字，保證清晰)
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 68px 'Inter', sans-serif";
    ctx.fillText(`我的${dimensionName}音樂日誌`, cardX + 40, cardY + 180);

    // 7. 總聆聽時長
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "bold 22px 'Inter', sans-serif";
    ctx.fillText("TOTAL LISTENING TIME", cardX + 40, cardY + 250);

    const durationStr = formatDuration(dimensionDurationMs);
    const timeGrad = ctx.createLinearGradient(cardX + 40, 0, cardX + 400, 0);
    timeGrad.addColorStop(0, "#1db954");
    timeGrad.addColorStop(0.5, "#8b5cf6");
    timeGrad.addColorStop(1, "#ec4899");
    ctx.fillStyle = timeGrad;
    ctx.font = "900 56px 'Inter', sans-serif";
    ctx.fillText(durationStr, cardX + 40, cardY + 305);

    // 8. 繪製 Top 曲風 (以精緻彩色圓形或標籤氣泡展示)
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "bold 22px 'Inter', sans-serif";
    ctx.fillText("MY TOP GENRES", cardX + 40, cardY + 380);

    const MOCK_GENRES_FOR_CARD = [
      { name: "Pop", count: 12 },
      { name: "Rock", count: 9 },
      { name: "Indie", count: 7 },
      { name: "R&B", count: 5 },
      { name: "Jazz", count: 3 }
    ];
    const activeGenres = topGenres.length > 0 ? topGenres.slice(0, 5) : MOCK_GENRES_FOR_CARD;
    let genreOffset = cardX + 40;
    activeGenres.forEach((g, idx) => {
      const tagText = `# ${g.name.toUpperCase()}`;
      ctx.font = "bold 16px 'Inter', sans-serif";
      const textWidth = ctx.measureText(tagText).width;
      const tagW = textWidth + 32;
      const tagH = 42;
      const tagY = cardY + 400;

      // 繪製標籤背景
      ctx.fillStyle = idx === 0 
        ? "rgba(236, 72, 153, 0.15)" // 粉紅
        : idx === 1 
        ? "rgba(29, 185, 84, 0.15)"  // 綠
        : idx === 2 
        ? "rgba(245, 158, 11, 0.15)"  // 橘
        : idx === 3
        ? "rgba(139, 92, 246, 0.15)"  // 紫
        : "rgba(14, 165, 233, 0.15)"; // 天藍

      ctx.beginPath();
      ctx.roundRect?.(genreOffset, tagY, tagW, tagH, 21);
      ctx.fill();

      // 標籤邊框
      ctx.strokeStyle = idx === 0 
        ? "rgba(236, 72, 153, 0.3)" 
        : idx === 1 
        ? "rgba(29, 185, 84, 0.3)" 
        : idx === 2 
        ? "rgba(245, 158, 11, 0.3)" 
        : idx === 3
        ? "rgba(139, 92, 246, 0.3)"
        : "rgba(14, 165, 233, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // 標籤文字
      ctx.fillStyle = idx === 0 
        ? "#f472b6" 
        : idx === 1 
        ? "#4ade80" 
        : idx === 2 
        ? "#fbbf24" 
        : idx === 3
        ? "#a78bfa"
        : "#38bdf8";
      ctx.fillText(tagText, genreOffset + 16, tagY + 26);

      genreOffset += tagW + 12;
    });

    // 9. 繪製 Top Singles {熱門單曲} 區塊 (左半 - 擴充至 TOP 5 歌，並放大排版)
    const listX = cardX + 40;
    const listY = cardY + 490;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "bold 22px 'Inter', sans-serif";
    ctx.fillText("TOP SINGLES", listX, listY);

    const activeTracks = topTracks.slice(0, 5);
    for (let i = 0; i < activeTracks.length; i++) {
      const track = activeTracks[i];
      const itemY = listY + 35 + i * 92;

      // 歌曲編號
      ctx.fillStyle = "#888888";
      ctx.font = "900 24px 'Inter', sans-serif";
      ctx.fillText(`${i + 1}`, listX, itemY + 38);

      // 繪製 fallback 封面圖背景 (圓角加大)
      const imgSize = 66;
      const imgX = listX + 36;
      const imgY = itemY;

      ctx.fillStyle = track.dominantColor || "#1e1e24";
      ctx.beginPath();
      ctx.roundRect?.(imgX, imgY, imgSize, imgSize, 8);
      ctx.fill();

      // 嘗試加載歌曲專輯封面
      if (track.coverImg) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = track.coverImg;
          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.save();
              ctx.beginPath();
              ctx.roundRect?.(imgX, imgY, imgSize, imgSize, 8);
              ctx.clip();
              ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
              ctx.restore();
              resolve();
            };
            img.onerror = () => {
              ctx.fillStyle = "#ffffff";
              ctx.font = "24px 'Inter', sans-serif";
              ctx.fillText("🎵", imgX + 20, imgY + 40);
              resolve();
            };
          });
        } catch (e) {
          console.error("Cover image draw error", e);
        }
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.font = "24px 'Inter', sans-serif";
        ctx.fillText("🎵", imgX + 20, imgY + 40);
      }

      // 歌名與歌手 (字體加大 1.5 倍)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px 'Inter', sans-serif";
      const titleText = track.title.length > 20 ? track.title.substring(0, 18) + "..." : track.title;
      ctx.fillText(titleText, imgX + 82, imgY + 28);

      ctx.fillStyle = "#888888";
      ctx.font = "500 16px 'Inter', sans-serif";
      const artistText = track.artist.length > 24 ? track.artist.substring(0, 22) + "..." : track.artist;
      ctx.fillText(artistText, imgX + 82, imgY + 52);
    }

    // 10. 全新設計：Canvas 版「品味聲波頻譜 {Taste Audio Spectrum}」(與 Top 5 歌曲對稱)
    const mapCX = cardX + cardW - 240;
    const mapCY = cardY + 630; // 配合 1100 高度，黃金置中
    ctx.save();

    // A. 繪製 5 大霓虹同心聲波環 (頻率與波幅隨聽歌次數正比)
    const mapGenres = activeGenres.slice(0, 5);
    const maxCount = Math.max(...mapGenres.map(g => g.count), 1);
    
    const ringSpecs: Array<{
      name: string;
      baseRadius: number;
      amplitude: number;
      freq: number;
      themeColor: string;
      labelX: number;
      labelY: number;
    }> = [];

    mapGenres.forEach((g, idx) => {
      const baseRadius = 60 + idx * 24; // 每圈間隔 24px
      const amplitude = 5 + (g.count / maxCount) * 8; // 波幅
      const freq = 6 + idx; // 聲波頻率
      const themeColor = [
        "#1db954", // 亮綠
        "#8b5cf6", // 紫
        "#ec4899", // 粉紅
        "#0ea5e9", // 天藍
        "#f59e0b"  // 橘黃
      ][idx % 5];

      // 1) 繪製波形線條
      ctx.save();
      ctx.shadowColor = themeColor;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 1.6;

      ctx.beginPath();
      const steps = 120;
      for (let i = 0; i <= steps; i++) {
        const theta = (i * 2 * Math.PI) / steps;
        const r = baseRadius + amplitude * Math.sin(freq * theta);
        const x = mapCX + r * Math.cos(theta);
        const y = mapCY + r * Math.sin(theta);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // 計算標籤座標 (5等分環繞)
      const labelAngle = (idx * 2 * Math.PI) / 5 - Math.PI / 2;
      const labelR = baseRadius + amplitude * Math.sin(freq * labelAngle);
      const labelX = mapCX + labelR * Math.cos(labelAngle);
      const labelY = mapCY + labelR * Math.sin(labelAngle);

      ringSpecs.push({
        name: g.name,
        baseRadius,
        amplitude,
        freq,
        themeColor,
        labelX,
        labelY
      });
    });

    // B. 繪製歌曲粒子 (在各自軌道上的發光霓虹圓球)
    activeTracks.slice(0, 5).forEach((track, idx) => {
      let ringIdx = idx % ringSpecs.length;
      if (track.genres) {
        const trackGenresList = track.genres.split(", ").map((t: string) => t.toLowerCase().trim());
        for (let i = 0; i < ringSpecs.length; i++) {
          const gName = ringSpecs[i].name.toLowerCase();
          if (trackGenresList.includes(gName)) {
            ringIdx = i;
            break;
          }
        }
      }

      const ring = ringSpecs[ringIdx];
      const angle = (idx * 2 * Math.PI) / 5 + Math.PI / 4;
      const particleR = ring.baseRadius + ring.amplitude * Math.sin(ring.freq * angle);
      const pX = mapCX + particleR * Math.cos(angle);
      const pY = mapCY + particleR * Math.sin(angle);
      const themeColor = track.dominantColor || ring.themeColor;

      ctx.save();
      ctx.shadowColor = themeColor;
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pX, pY, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // C. 繪製曲風文字標籤 (膠囊底板 + 英文大寫)
    ringSpecs.forEach((ring) => {
      ctx.save();
      // 膠囊底板
      ctx.fillStyle = "rgba(6, 6, 8, 0.9)";
      ctx.strokeStyle = ring.themeColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect?.(ring.labelX - 42, ring.labelY - 10, 84, 20, 10);
      ctx.fill();
      ctx.stroke();

      // 文字
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 10px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 2;
      ctx.fillText(ring.name.toUpperCase(), ring.labelX, ring.labelY + 1);
      ctx.restore();
    });

    // D. 中心旋轉唱片頭像 (引力中心)
    ctx.save();
    // 漸變彩虹外圈發光
    const sunGrad = ctx.createLinearGradient(mapCX - 28, mapCY - 28, mapCX + 28, mapCY + 28);
    sunGrad.addColorStop(0, "#1db954");
    sunGrad.addColorStop(0.5, "#8b5cf6");
    sunGrad.addColorStop(1, "#ec4899");
    
    ctx.save();
    ctx.shadowColor = "rgba(139, 92, 246, 0.4)";
    ctx.shadowBlur = 12;
    ctx.strokeStyle = sunGrad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(mapCX, mapCY, 26, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();

    // 黑膠唱片底
    ctx.fillStyle = "#0c0c0e";
    ctx.beginPath();
    ctx.arc(mapCX, mapCY, 25, 0, 2 * Math.PI);
    ctx.fill();

    // 唱片細螺紋
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(mapCX, mapCY, 18, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mapCX, mapCY, 12, 0, 2 * Math.PI);
    ctx.stroke();

    // 載入頭像
    if (userImage) {
      try {
        const uImg = new Image();
        uImg.crossOrigin = "anonymous";
        uImg.src = userImage;
        await new Promise<void>((resolve) => {
          uImg.onload = () => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(mapCX, mapCY, 23, 0, 2 * Math.PI);
            ctx.clip();
            ctx.drawImage(uImg, mapCX - 23, mapCY - 23, 46, 46);
            ctx.restore();
            resolve();
          };
          uImg.onerror = () => {
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 20px 'Inter', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(userName ? userName.charAt(0).toUpperCase() : "U", mapCX, mapCY);
            resolve();
          };
        });
      } catch (e) {
        console.error("User avatar draw error", e);
      }
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(userName ? userName.charAt(0).toUpperCase() : "U", mapCX, mapCY);
    }
    ctx.restore();

    // 將 Canvas 轉換為 Base64 高解析度圖片，寫入 state 用於高品質顯示，防止縮小模糊
    const dataUrl = canvas.toDataURL("image/png");
    setCardImgSrc(dataUrl);
    setRendered(true);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Ditto_Music_Log_${dimensionName}_${userName || "user"}.png`;
      link.href = dataUrl;
      link.click();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("下載失敗:", err);
      alert("由於瀏覽器安全限制，外部頭像可能暫時無法繪製。請嘗試截圖分享！");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)"
        }}>
          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4 }}
            style={{
              background: "rgba(20, 20, 24, 0.88)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "28px",
              width: "100%",
              maxWidth: "540px",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxShadow: "0 25px 60px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.15), 0 0 40px rgba(139, 92, 246, 0.1)",
              backdropFilter: "blur(24px)"
            }}
          >
            {/* Header */}
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 900, color: "#fff", letterSpacing: "0.5px" }}>
                社群分享卡片 {`{Share Card}`}
              </h3>
              <button
                onClick={onClose}
                onMouseEnter={() => setCloseHovered(true)}
                onMouseLeave={() => setCloseHovered(false)}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  borderRadius: "50%",
                  width: "34px",
                  height: "34px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  color: closeHovered ? "#fff" : "#aaa",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  transform: closeHovered ? "rotate(90deg) scale(1.1)" : "scale(1)"
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Canvas Preview (改用高品質 img 渲染，徹底免除 Canvas 直接縮小產生的模糊邊緣) */}
            <div style={{
              position: "relative",
              width: "100%",
              aspectRatio: "5/6",
              background: "#0c0c0e",
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 15px 30px rgba(0, 0, 0, 0.5)",
              marginBottom: "24px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}>
              {/* 隱藏的 Canvas (僅用於背景繪圖與匯出) */}
              <canvas
                ref={canvasRef}
                style={{
                  position: "absolute",
                  left: "-9999px",
                  visibility: "hidden"
                }}
              />
              
              {rendered && cardImgSrc ? (
                <img
                  src={cardImgSrc}
                  alt="Ditto Share Card"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    WebkitFontSmoothing: "antialiased"
                  }}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: "#666" }}>
                  <div style={{ width: "30px", height: "30px", border: "2px solid #333", borderTopColor: "#1db954", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: "13px" }}>正在產生高質感圖卡...</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={handleDownload}
                disabled={!rendered || downloading}
                onMouseEnter={() => setDownloadHovered(true)}
                onMouseLeave={() => setDownloadHovered(false)}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "100px",
                  border: "none",
                  background: copied 
                    ? "#16a34a" 
                    : downloadHovered
                    ? "linear-gradient(135deg, #22c55e, #a78bfa)"
                    : "linear-gradient(135deg, #1db954, #8b5cf6)",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: downloadHovered 
                    ? "0 10px 25px rgba(139, 92, 246, 0.4)" 
                    : "0 6px 16px rgba(139, 92, 246, 0.25)",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  transform: downloadHovered ? "scale(1.02)" : "scale(1)"
                }}
              >
                {copied ? (
                  <>
                    <Check size={18} />
                    下載成功！
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    下載 PNG 分享圖卡
                  </>
                )}
              </button>

              <div style={{ display: "flex", gap: "6px", alignItems: "flex-start", marginTop: "4px" }}>
                <ShieldAlert size={14} color="#888" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span style={{ fontSize: "11.5px", color: "#888", lineHeight: "1.4" }}>
                  提示：如果系統無法下載，您也可以直接對畫布進行螢幕截圖分享至您的 Instagram 限時動態。
                </span>
              </div>
            </div>
          </motion.div>
          
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </AnimatePresence>
  );
}
