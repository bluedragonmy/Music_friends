"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import Script from "next/script";
import Pusher from "pusher-js";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";

interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export default function ChatRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = React.use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [myId, setMyId] = useState<string | null>(null);
  const [partner, setPartner] = useState<any>(null);
  const [roomStatus, setRoomStatus] = useState<string>("ACTIVE");
  
  // 雙盲選擇
  const [myChoice, setMyChoice] = useState<string | null>(null);
  const [partnerChoice, setPartnerChoice] = useState<string | null>(null);
  const [otherChoiceSubmitted, setOtherChoiceSubmitted] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  
  // 倒數計時顯示
  const [timeLeftSec, setTimeLeftSec] = useState<number>(300);
  const [isExpired, setIsExpired] = useState(false);

  // 訊息
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");

  // 同步聆聽
  const [syncInvitation, setSyncInvitation] = useState<any>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<any>(null);
  const [isPlayingSync, setIsPlayingSync] = useState<boolean>(false);
  const [acceptedSyncTrackId, setAcceptedSyncTrackId] = useState<string | null>(null);
  const [waitingForSync, setWaitingForSync] = useState<any>(null);
  const [isLeader, setIsLeader] = useState<boolean>(false);

  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const spotify = useSpotifyPlayer();

  // 1. 載入歷史資料
  useEffect(() => {
    if (!session || !roomId) return;

    async function loadChatData() {
      try {
        const res = await fetch(`/api/chat/${roomId}?t=${Date.now()}`);
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setMyId(data.myId);
          setPartner(data.partner);
          setRoomStatus(data.room.status);
          setMyChoice(data.room.myChoice);
          setPartnerChoice(data.room.partnerChoice);
          setMessages(data.messages);
          if (data.room.expiresAt) {
            setExpiresAt(new Date(data.room.expiresAt));
          }
        }
      } catch (err) {
        setError("載入資料失敗");
      } finally {
        setLoading(false);
      }
    }

    loadChatData();
  }, [session, roomId]);

  // 前端計算倒數計時
  useEffect(() => {
    if (!expiresAt || roomStatus !== "ACTIVE") return;

    const updateTimer = () => {
      const now = new Date();
      const diffSec = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
      
      if (diffSec <= 0) {
        setTimeLeftSec(0);
        setIsExpired(true);
        // 如果過期且還沒決定，強制設定狀態為已結束
        if (roomStatus === "ACTIVE") setRoomStatus("EXPIRED");
      } else {
        setTimeLeftSec(diffSec);
      }
    };

    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [expiresAt, roomStatus]);

  // 2. 初始化 Pusher 連線
  useEffect(() => {
    if (!myId || !roomId || !process.env.NEXT_PUBLIC_PUSHER_KEY) return;

    Pusher.logToConsole = true;

    // 避免重複連線
    if (!pusherRef.current) {
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      });
    }
    
    const pusher = pusherRef.current;
    let channel = pusher.channel(`room-${roomId}`);
    if (!channel) {
      channel = pusher.subscribe(`room-${roomId}`);
    }
    channelRef.current = channel;

    // A. 接收狀態變更
    channel.bind("room_status_changed", (data: { status: string }) => {
      setRoomStatus(data.status);
    });

    // B. 接收即時訊息
    channel.bind("receive_message", (message: Message) => {
      setMessages((prev) => {
        // 1. 防止自己剛剛樂觀更新的訊息被重複推入
        if (prev.some(m => m.id === message.id)) return prev;

        // 2. 如果是自己發送的訊息，尋找對應的樂觀更新 temp 訊息並替換
        if (message.senderId === myId) {
          const tempIdx = prev.findIndex(
            (m) => m.id?.startsWith("temp_") && m.content === message.content
          );
          if (tempIdx !== -1) {
            const updated = [...prev];
            updated[tempIdx] = message;
            return updated;
          }
        }

        return [...prev, message];
      });
    });

    // C. 接收同步播放邀請
    channel.bind("sync_play_invite", (invite: any) => {
      if (invite.senderId === myId) return; // 自己發出的邀請不顯示接受按鈕

      setSyncInvitation(invite);
      // 8秒後自動關閉通知
      setTimeout(() => {
        setSyncInvitation((curr: any) => (curr?.trackId === invite.trackId ? null : curr));
      }, 8000);
    });

    // D. 接收雙盲結算進度
    channel.bind("blind_choice_submitted", (data: { submittedUserId: string }) => {
      if (data.submittedUserId !== myId) {
        setOtherChoiceSubmitted(true);
        setPartnerChoice("SUBMITTED");
      }
    });

    channel.bind("blind_choice_resolved", (data: { status: string; user1Choice: string; user2Choice: string }) => {
      setRoomStatus(data.status);
      setOtherChoiceSubmitted(true);
      if (myId === data.user1Choice) {
        setPartnerChoice(data.user2Choice);
      } else {
        setPartnerChoice(data.user1Choice);
      }
    });

    channel.bind("sync_play_accepted", (data: { trackId: string }) => {
      setAcceptedSyncTrackId(data.trackId);
    });

    // E. 接收同步播放控制訊號 (具備傳輸延遲補償與智能容差對齊)
    channel.bind("playback_control", async (data: { senderId: string; action: "PLAY" | "PAUSE" | "RESTART"; positionMs?: number; timestamp?: number }) => {
      if (data.senderId !== myId) {
        // 先本地執行基礎播放控制
        await executePlaybackAction(data.action);

        // 如果是播放狀態且攜帶進度資料，執行精準校準
        if (data.action === "PLAY" && typeof data.positionMs === "number" && data.timestamp) {
          const networkLatency = Math.max(0, Date.now() - data.timestamp);
          const safeLatency = networkLatency > 3000 ? 0 : networkLatency; // 過濾異常的超大網絡延遲
          const targetPos = data.positionMs + safeLatency;

          // 取得本地播放器的實際播放時間點
          let currentPos = 0;
          if (spotify.isReady && window._spotifyPlayerInstance) {
            const state = await window._spotifyPlayerInstance.getCurrentState();
            if (state) currentPos = state.position;
          } else if (audioRef.current) {
            currentPos = audioRef.current.currentTime * 1000;
          }

          const offset = Math.abs(currentPos - targetPos);
          // 容差閾值設為 1200 毫秒，大於該值時才執行 Seek 校正，避免因微小誤差導致連續 seek 引起音樂頓挫
          if (offset > 1200) {
            console.log(`[Sync] ⏳ 播放時間相差 ${offset}ms (>1200ms)，執行對齊，目標位置：${targetPos}ms`);
            if (spotify.isReady) {
              await spotify.seek(targetPos);
            } else if (audioRef.current) {
              audioRef.current.currentTime = targetPos / 1000;
            }
          }
        }
      }
    });

    return () => {
      // 元件卸載時清理監聽器
      if (channel) {
        channel.unbind_all();
        pusher.unsubscribe(`room-${roomId}`);
      }
    };
  }, [myId, roomId]);

  // 處理對方接受邀請後，發送方也開始播放 (採用多重相容 ID 比對)
  useEffect(() => {
    if (acceptedSyncTrackId && waitingForSync) {
      const isMatch = 
        waitingForSync.spotifyId === acceptedSyncTrackId || 
        waitingForSync.id === acceptedSyncTrackId ||
        (waitingForSync.spotifyId && acceptedSyncTrackId.includes(waitingForSync.spotifyId)) ||
        (waitingForSync.id && acceptedSyncTrackId.includes(waitingForSync.id));

      if (isMatch) {
        playTrack(waitingForSync, 0);
        setWaitingForSync(null);
        setAcceptedSyncTrackId(null);
      }
    }
  }, [acceptedSyncTrackId, waitingForSync]);

  // 自動捲動到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 發送訊息
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !myId) return;
    
    const text = inputText;
    setInputText("");

    // 樂觀更新 (Optimistic Update)
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      roomId,
      senderId: myId,
      content: text,
      createdAt: new Date().toISOString(),
      sender: { name: "", image: "" }
    };
    
    // @ts-ignore (因為 Message 結構問題暫時 ignore)
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await fetch(`/api/chat/${roomId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      
      // 如果後端回傳成功，將 tempId 換成真正的 ID
      if (data.success && data.message) {
        setMessages((prev) => {
          const hasRealId = prev.some((m) => m.id === data.message.id);
          return prev.map((m) => {
            if (m.id === tempId) {
              return hasRealId ? null : data.message;
            }
            return m;
          }).filter(Boolean) as Message[];
        });
      }
    } catch (err) {
      console.error("發送訊息失敗:", err);
      // 如果失敗了，把剛剛樂觀更新的訊息移除
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      setError("訊息發送失敗，請檢查網路");
    }
  };

  // 發送同步播放邀請
  const handleSyncPlayInvite = async (track: any) => {
    setIsLeader(true); // 邀請方成為同步主控 Leader
    try {
      await fetch(`/api/chat/${roomId}/sync-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: track.spotifyId || track.id, // Fallback 到本地 cuid id，確保有值且能被比對
          title: track.title,
          artist: track.artist,
          coverImg: track.coverImg,
          previewUrl: track.previewUrl || track.url || "",
          startTimestamp: Date.now(), // 記錄發送時的時間點，用來給對方校準
        }),
      });
      
      setWaitingForSync(track);
      setTimeout(() => {
        setWaitingForSync((curr: any) => (curr?.spotifyId === track.spotifyId ? null : curr));
      }, 8000);
    } catch (err) {
      console.error("發送同步邀請失敗:", err);
    }
  };

  // 取得真實可播放的 HTTP/HTTPS 音訊連結，過濾 spotify: URI
  const getRealAudioSrc = (t: any): string => {
    if (t.previewUrl && t.previewUrl.startsWith("http")) return t.previewUrl;
    if (t.url && t.url.startsWith("http")) return t.url;
    return "";
  };

  // 執行播放器指令 (包含 Spotify SDK 與一般降級播放)
  const executePlaybackAction = async (action: "PLAY" | "PAUSE" | "RESTART") => {
    if (action === "PLAY") {
      setIsPlayingSync(true);
      if (spotify.isReady) await spotify.resume();
      if (audioRef.current) audioRef.current.play().catch(e => console.warn(e));
    } 
    else if (action === "PAUSE") {
      setIsPlayingSync(false);
      if (spotify.isReady) await spotify.pause();
      if (audioRef.current) audioRef.current.pause();
    } 
    else if (action === "RESTART") {
      setIsPlayingSync(true);
      if (spotify.isReady && currentlyPlaying) {
        await spotify.playTrack(currentlyPlaying.spotifyId, 0);
      }
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.warn(e));
      }
    }
  };

  // 取得本地播放器的實際播放進度毫秒數
  const getLocalCurrentPositionMs = async (): Promise<number> => {
    if (spotify.isReady && window._spotifyPlayerInstance) {
      const state = await window._spotifyPlayerInstance.getCurrentState();
      if (state) return state.position;
    } else if (audioRef.current) {
      return audioRef.current.currentTime * 1000;
    }
    return 0;
  };

  // 背景同步心跳計時器 (身為 Leader 時每 4.5 秒向對方發送播放狀態校正)
  useEffect(() => {
    if (!isLeader || !isPlayingSync || !currentlyPlaying || roomStatus !== "ACTIVE") return;

    const intervalId = setInterval(async () => {
      const pos = await getLocalCurrentPositionMs();
      fetch(`/api/chat/${roomId}/playback-control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "PLAY", 
          positionMs: pos,
          timestamp: Date.now() 
        }),
      }).catch((err) => console.warn("[Background Sync Heartbeat Failed]:", err));
    }, 4500);

    return () => clearInterval(intervalId);
  }, [isLeader, isPlayingSync, currentlyPlaying, roomStatus]);

  // 當自己主動發起控制 (點擊按鈕)
  const emitPlaybackControl = async (action: "PLAY" | "PAUSE" | "RESTART") => {
    executePlaybackAction(action); // 先本地樂觀執行
    const pos = await getLocalCurrentPositionMs();
    try {
      await fetch(`/api/chat/${roomId}/playback-control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action,
          positionMs: action === "PAUSE" ? pos : (action === "RESTART" ? 0 : pos),
          timestamp: Date.now()
        }),
      });
    } catch (err) {
      console.error("發送播放控制訊號失敗:", err);
    }
  };

  // 播放音樂 (包含降級機制)
  const playTrack = async (track: any, positionMs = 0) => {
    let isPlayingPremium = false;
    const currentTrackId = track.spotifyId || track.id;
    if (spotify.isReady && currentTrackId) {
      isPlayingPremium = await spotify.playTrack(currentTrackId, positionMs);
    }
    
    if (!isPlayingPremium) {
      // 🟡 備用降級機制 (優先提取真實 MP3 連結，過濾 spotify: 協定)
      const audioSrc = getRealAudioSrc(track);
      if (!audioSrc) {
        console.warn("⚠️ 網頁播放器尚未就緒且無試聽片段 (或此為 Spotify 特有 URI)。");
        return;
      }
      setCurrentlyPlaying(track);
      setIsPlayingSync(true);
      if (audioRef.current) {
        audioRef.current.src = audioSrc;
        audioRef.current.play().catch((err) => {
          console.warn("自動播放受限:", err);
          setIsPlayingSync(false);
        });
      }
    } else {
      setCurrentlyPlaying(track);
      setIsPlayingSync(true);
    }
  };

  // 接收並同步播放 (包含降級機制)
  const acceptSyncInvitation = async () => {
    if (!syncInvitation) return;
    setIsLeader(false); // 接受方為跟隨者，非同步 Leader
    
    // 通知對方我已接受，可以開始播了
    fetch(`/api/chat/${roomId}/sync-accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId: syncInvitation.trackId }),
    }).catch((err) => console.error("發送接受訊號失敗:", err));
    
    let isPlayingPremium = false;
    if (spotify.isReady) {
      isPlayingPremium = await spotify.playTrack(syncInvitation.trackId, 0); // 雙方都從 0 開始
    }
    
    if (!isPlayingPremium) {
      // 🟡 備用降級機制
      const audioSrc = getRealAudioSrc(syncInvitation);
      if (!audioSrc) {
        console.warn("⚠️ 網頁播放器尚未就緒且無試聽片段。");
        setSyncInvitation(null);
        return;
      }
      setCurrentlyPlaying(syncInvitation);
      setIsPlayingSync(true);
      if (audioRef.current) {
        audioRef.current.src = audioSrc;
        audioRef.current.currentTime = 0; // 雙方都從 0 開始
        audioRef.current.play().catch((err) => {
          console.warn("自動播放受限:", err);
          setIsPlayingSync(false);
        });
      }
    } else {
      setCurrentlyPlaying(syncInvitation);
      setIsPlayingSync(true);
    }
    setSyncInvitation(null);
  };

  // 提交雙盲配對決定
  const submitBlindChoice = async (choice: "KEEP" | "END") => {
    try {
      const res = await fetch(`/api/chat/${roomId}/blind-choice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice }),
      });
      const data = await res.json();
      if (!data.error) {
        setMyChoice(choice);
      }
    } catch (err) {
      console.error("提交決定失敗:", err);
    }
  };

  // 刪除聊天室
  const handleDeleteRoom = async () => {
    if (!confirm("確定要永久刪除這個聊天室嗎？這將無法復原。")) return;
    try {
      const res = await fetch(`/api/chat/${roomId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/");
      } else {
        alert("刪除失敗");
      }
    } catch (err) {
      console.error("刪除失敗:", err);
    }
  };

  if (status === "loading" || loading) {
    return <div style={{ minHeight: "100vh", backgroundColor: "#050505" }}></div>;
  }

  if (error || !partner) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", backgroundColor: "#050505" }}>
        {error || "無法載入房間資訊"}
      </div>
    );
  }

  return (
    <div style={{
      height: "100dvh", maxHeight: "100dvh", backgroundColor: "#050505",
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
      color: "#ffffff", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column",
      alignItems: "center", overflow: "hidden"
    }}>
      {/* 載入 Spotify Web Playback SDK — 此標籤是播放功能的命脈 */}
      <Script src="https://sdk.scdn.co/spotify-player.js" strategy="afterInteractive" />
      {/* 隱藏的 Audio 元素，用於非 Premium 用戶的 30 秒試聽降級播放 */}
      <audio ref={audioRef} style={{ display: "none" }} />
      
      <div style={{ width: "100%", maxWidth: "450px", flex: 1, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", minHeight: 0 }}>
        
        {/* Top Header */}
        <div style={{
          padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(5, 5, 5, 0.8)", backdropFilter: "blur(20px)",
          zIndex: 10
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "#888", fontSize: "20px", cursor: "pointer", padding: "0" }}>
              ←
            </button>
            {partner?.image ? (
              <img src={partner.image} alt="Avatar" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" }} />
            ) : (
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #1db954, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>👤</div>
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "15px", fontWeight: 700 }}>{partner?.name || "匿名用戶"}</span>
              {roomStatus === "ACTIVE" ? (
                <span style={{ fontSize: "11px", color: timeLeftSec <= 60 ? "#ef4444" : "#1db954", fontWeight: 600 }}>
                  ⏳ 剩餘 {Math.floor(timeLeftSec / 60)}:{(timeLeftSec % 60).toString().padStart(2, "0")}
                </span>
              ) : (
                <span style={{ fontSize: "11px", color: roomStatus === "MATCHED" ? "#1db954" : "#ef4444", fontWeight: 600 }}>
                  {roomStatus === "MATCHED" ? "💖 完美配對" : "💔 聊天結束"}
                </span>
              )}
            </div>
          </div>
          
          <button onClick={handleDeleteRoom} title="刪除聊天室" style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", padding: "0", opacity: 0.8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            🚪
          </button>
        </div>

        {/* Sync Invitation Banner */}
        {syncInvitation && (
          <div style={{
            background: "rgba(29, 185, 84, 0.15)", borderBottom: "1px solid rgba(29, 185, 84, 0.3)",
            padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
            backdropFilter: "blur(10px)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: "20px", animation: "bounce 1s infinite" }}>🎵</span>
              <div style={{ overflow: "hidden" }}>
                <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>{partner?.name} 邀請同步共聆</p>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{syncInvitation.title}</p>
                {syncInvitation.artist && (
                  <p style={{ margin: 0, fontSize: "11px", color: "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{syncInvitation.artist}</p>
                )}
              </div>
            </div>
            <button onClick={acceptSyncInvitation} style={{ padding: "6px 16px", background: "#1db954", color: "#fff", border: "none", borderRadius: "100px", fontSize: "12px", fontWeight: 700, cursor: "pointer", marginLeft: "10px", flexShrink: 0 }}>
              接受
            </button>
          </div>
        )}

        {/* Music Playlist (Horizontal Scroll) */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", overflowX: "auto", gap: "12px", scrollbarWidth: "none" }}>
          <div style={{ fontSize: "12px", color: "#888", display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>對方最愛</div>
          {partner?.playlists?.[0]?.tracks.map((t: any) => (
            <div key={t.track.id} onClick={() => handleSyncPlayInvite(t.track)} style={{
              display: "flex", alignItems: "center", gap: "8px", background: currentlyPlaying?.spotifyId === t.track.spotifyId ? "rgba(29, 185, 84, 0.2)" : "rgba(255,255,255,0.05)",
              padding: "6px 12px 6px 6px", borderRadius: "100px", cursor: "pointer", whiteSpace: "nowrap",
              border: currentlyPlaying?.spotifyId === t.track.spotifyId ? "1px solid rgba(29, 185, 84, 0.5)" : "1px solid transparent"
            }}>
              {t.track.coverImg ? (
                <img src={t.track.coverImg} alt="Cover" style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#333" }} />
              )}
              <span style={{ fontSize: "12px", maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis" }}>{t.track.title}</span>
            </div>
          ))}
        </div>

        {/* Current Playing Status & SDK Info */}
        {(currentlyPlaying || !spotify.isReady) && (
          <div style={{ padding: "12px 20px", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: "12px", color: currentlyPlaying ? "#1db954" : "#888", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {currentlyPlaying ? `🎧 共聽中: ${currentlyPlaying.title}` : "等待共聽..."}
              </span>
              <span style={{ fontSize: "10px", color: spotify.isReady ? "#1db954" : spotify.error ? "#ef4444" : "#f59e0b" }}>
                {spotify.isReady ? "● Spotify Ready" : spotify.error ? "● Player Error" : "● Connecting..."}
              </span>
            </div>
            
            {/* Playback Controls */}
            {currentlyPlaying && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                <button 
                  onClick={() => emitPlaybackControl("RESTART")}
                  title="回到從頭 (雙方同步)"
                  style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px", transition: "transform 0.1s" }}
                  onMouseDown={e => e.currentTarget.style.transform = "scale(0.9)"}
                  onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  ⏮️
                </button>
                <button 
                  onClick={() => isPlayingSync ? emitPlaybackControl("PAUSE") : emitPlaybackControl("PLAY")}
                  title={isPlayingSync ? "暫停 (雙方同步)" : "播放 (雙方同步)"}
                  style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", cursor: "pointer", fontSize: "14px", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.1s, background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                  onMouseDown={e => e.currentTarget.style.transform = "scale(0.9)"}
                  onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  {isPlayingSync ? "⏸️" : "▶️"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Chat Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", minHeight: 0 }}>
          {roomStatus === "ACTIVE" && (
            <div style={{ textAlign: "center", fontSize: "12px", color: "#666", marginBottom: "10px", padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "12px" }}>
              對話已加密。倒數計時結束前，若雙方皆選擇 LIKE，即可永久保留聊天室。
            </div>
          )}
          {roomStatus === "MATCHED" && (
            <div style={{ textAlign: "center", fontSize: "13px", color: "#1db954", marginBottom: "10px", padding: "10px", background: "rgba(29, 185, 84, 0.1)", borderRadius: "12px", fontWeight: 600 }}>
              🎉 恭喜！雙方皆選擇保留，配對成功！
            </div>
          )}
          {messages
            .filter((msg, idx, self) => self.findIndex(m => m.id === msg.id) === idx)
            .map((msg, idx) => {
              const isMe = msg.senderId === myId;
              return (
                <div key={msg.id || idx} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", width: "100%" }}>
                {!isMe && (
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", marginRight: "8px", flexShrink: 0, overflow: "hidden" }}>
                    {partner?.image && <img src={partner.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                )}
                <div style={{
                  maxWidth: "75%", padding: "12px 16px", fontSize: "14px", lineHeight: "1.5",
                  background: isMe ? "linear-gradient(135deg, #1db954, #17a347)" : "rgba(255, 255, 255, 0.08)",
                  color: isMe ? "#ffffff" : "#eeeeee",
                  borderRadius: isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.2)"
                }}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Action Area (Bottom) */}
        {roomStatus === "MATCHED" || (roomStatus === "ACTIVE" && timeLeftSec > 0) ? (
          /* 平常聊天 (MATCHED 或 ACTIVE 且倒數未結束) */
          <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(5, 5, 5, 0.95)", backdropFilter: "blur(20px)", zIndex: 10 }}>
            <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="輸入訊息..."
                  style={{ width: "100%", padding: "12px 45px 12px 16px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px", outline: "none" }}
                />
                <button type="submit" disabled={!inputText.trim()} style={{ position: "absolute", right: "4px", top: "4px", bottom: "4px", width: "36px", border: "none", borderRadius: "50%", background: inputText.trim() ? "#1db954" : "rgba(255,255,255,0.1)", color: "#fff", cursor: inputText.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}>
                  ↑
                </button>
              </div>
            </form>
          </div>
        ) : roomStatus === "ACTIVE" && timeLeftSec <= 0 ? (
          /* 倒數時間結束：跳出提示問要不要配對 */
          <div style={{ padding: "24px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, rgba(15, 15, 25, 0.95) 0%, rgba(5, 5, 5, 0.98) 100%)", backdropFilter: "blur(30px)", zIndex: 10, textAlign: "center" }}>
            {myChoice ? (
              <div style={{ padding: "10px 0" }}>
                <div style={{ fontSize: "18px", marginBottom: "8px" }}>⏳</div>
                <div style={{ color: "#fff", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                  您已選擇 {myChoice === "KEEP" ? "💖 繼續配對" : "🚫 結束對話"}
                </div>
                <div style={{ color: "#888", fontSize: "12px" }}>正在等待對方的靈魂做出回應...</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: "20px", marginBottom: "8px" }}>⏳</div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 8px 0", color: "#fff" }}>音樂盲聊倒數結束！</h3>
                <p style={{ fontSize: "13px", color: "#bbb", margin: "0 0 20px 0", lineHeight: "1.6" }}>
                  48小時的共鳴時間已悄然流逝。<br />
                  您想與對方的靈魂正式配對，並解鎖彼此的完整檔案嗎？
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (window.confirm("確定要與對方建立正式配對關係嗎？")) {
                        submitBlindChoice("KEEP");
                      }
                    }} 
                    style={{ flex: 1, maxWidth: "160px", padding: "12px", borderRadius: "100px", border: "none", background: "linear-gradient(135deg, #1db954, #8b5cf6)", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "transform 0.2s" }}
                  >
                    💖 繼續配對
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (window.confirm("確定要結束對話並放手嗎？這將會封存此聊天室。")) {
                        submitBlindChoice("END");
                      }
                    }} 
                    style={{ flex: 1, maxWidth: "160px", padding: "12px", borderRadius: "100px", border: "1px solid rgba(239, 68, 68, 0.5)", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
                  >
                    🚫 結束配對
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 對話已結束 (CLOSED, EXPIRED 等) */
          <div style={{ padding: "24px 20px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(5, 5, 5, 0.95)", zIndex: 10 }}>
            <div style={{ color: "#ef4444", fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>對話已結束</div>
            <button onClick={() => router.push("/")} style={{ width: "100%", padding: "14px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
              回到首頁
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
