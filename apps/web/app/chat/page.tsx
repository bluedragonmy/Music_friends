"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Disc3, Music, Music2, MessageCircle, User } from "lucide-react";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";
import styles from "@/components/chat/ChatList.module.css";

interface ChatRoomInfo {
  id: string;
  status: "ACTIVE" | "CLOSED" | "MATCHED";
  expiresAt: string;
  createdAt: string;
  partner: {
    id: string;
    name: string | null;
    image: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isMine: boolean;
  } | null;
}

export default function ChatListPage() {
  const [activeRooms, setActiveRooms] = useState<ChatRoomInfo[]>([]);
  const [isRoomsLoading, setIsRoomsLoading] = useState(true);
  const [retrievalError, setRetrievalError] = useState<string | null>(null);
  
  const { data: userSession } = useSession();
  const pusherConnectionRef = useRef<Pusher | null>(null);

  const fetchUpdatedRooms = useCallback(async () => {
    try {
      const timestampQuery = `?nocache=${Date.now()}`;
      const response = await fetch(`/api/chat/list${timestampQuery}`);
      if (!response.ok) throw new Error("Could not retrieve active conversations");
      const payload = await response.json();
      setActiveRooms(payload.rooms || []);
    } catch (err) {
      console.error(err);
      setRetrievalError("無法載入聊天室列表，請確認已登入");
    } finally {
      setIsRoomsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpdatedRooms();
  }, [fetchUpdatedRooms]);

  // Establish real-time Pusher listener channel
  useEffect(() => {
    if (!userSession?.user?.email) return;

    Pusher.logToConsole = true;
    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    pusherConnectionRef.current = pusherClient;

    const sanitizedEmail = userSession.user.email.replace(/@/g, "-").replace(/\./g, "-");
    const notificationChannelName = `user-${sanitizedEmail}`;
    const notificationChannel = pusherClient.subscribe(notificationChannelName);

    notificationChannel.bind("new_match", () => {
      console.log("[Chat List] New match event detected, re-syncing list");
      fetchUpdatedRooms();
    });

    return () => {
      notificationChannel.unbind_all();
      pusherClient.unsubscribe(notificationChannelName);
      pusherClient.disconnect();
    };
  }, [userSession, fetchUpdatedRooms]);

  // Handle dynamic Pusher channel binding for active chat message updates
  useEffect(() => {
    const pusherClient = pusherConnectionRef.current;
    if (!pusherClient || activeRooms.length === 0) return;

    const monitoredChannels: string[] = [];

    activeRooms.forEach((room) => {
      const channelName = `room-${room.id}`;
      if (!pusherClient.channel(channelName)) {
        const roomChannel = pusherClient.subscribe(channelName);
        monitoredChannels.push(channelName);
        roomChannel.bind("receive_message", () => {
          console.log(`[Chat List] Activity detected in room: ${room.id}. Refreshing room list.`);
          fetchUpdatedRooms();
        });
      }
    });

    return () => {
      monitoredChannels.forEach((channelName) => {
        const channel = pusherClient.channel(channelName);
        if (channel) {
          channel.unbind_all();
          pusherClient.unsubscribe(channelName);
        }
      });
    };
  }, [activeRooms, fetchUpdatedRooms]);

  const calculateExpiresIn = (expiryDateString: string) => {
    const timeDelta = new Date(expiryDateString).getTime() - Date.now();
    if (timeDelta <= 0) return "已過期";
    const hours = Math.floor(timeDelta / (1000 * 60 * 60));
    const minutes = Math.floor((timeDelta % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const convertISOTime = (isoString: string) => {
    const targetDate = new Date(isoString);
    const currentDate = new Date();
    if (targetDate.toDateString() === currentDate.toDateString()) {
      return targetDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return targetDate.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const triggerDatabaseReset = async () => {
    const confirmMessage = "🚨 警告：這將會清除全資料庫所有人的聊天室、歷史訊息與滑卡紀錄！確定要一鍵清理嗎？";
    if (!window.confirm(confirmMessage)) return;
    
    try {
      setIsRoomsLoading(true);
      const res = await fetch("/api/test/reset", { method: "POST" });
      const payload = await res.json();
      if (payload.error) throw new Error(payload.error);
      alert("🧹 歷史配對與聊天紀錄已全數洗淨，一切重歸起點！");
      setActiveRooms([]);
    } catch (err: any) {
      alert("❌ 清理失敗：" + err.message);
    } finally {
      setIsRoomsLoading(false);
    }
  };

  return (
    <div className={styles.mainContainer}>
      {/* Top Header */}
      <div style={{ width: "100%", maxWidth: "450px", padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0 }}>Messages</h1>
          <p style={{ color: "#888888", fontSize: "14px", margin: "4px 0 0 0" }}>連線中的靈魂共鳴</p>
        </div>
        <button
          onClick={triggerDatabaseReset}
          style={{
            padding: "8px 12px",
            borderRadius: "12px",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            background: "rgba(239, 68, 68, 0.1)",
            color: "#ef4444",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
          }}
        >
          🧹 快速清理
        </button>
      </div>

      {/* Conversations feed */}
      <div style={{ flex: 1, width: "100%", maxWidth: "450px", overflowY: "auto", padding: "20px" }}>
        {isRoomsLoading ? (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", color: "#ffffff", gap: "16px" }}>
            <div style={{ position: "relative" }}>
              <Disc3 className="animate-spin" size={80} strokeWidth={1.5} />
              <div style={{ position: "absolute", top: "-12px", right: "-28px", animation: "bounce 2s infinite" }}>
                <Music size={28} strokeWidth={2} />
              </div>
              <div style={{ position: "absolute", bottom: "4px", left: "-32px", animation: "bounce 2s infinite 0.5s" }}>
                <Music2 size={24} strokeWidth={2} />
              </div>
            </div>
            <span className="animate-dots" style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "2px", marginLeft: "-8px", marginTop: "8px" }}>LOADING</span>
          </div>
        ) : retrievalError ? (
          <div className={styles.emptyStateContainer} style={{ color: "#ef4444" }}>{retrievalError}</div>
        ) : activeRooms.length === 0 ? (
          <div className={styles.emptyStateContainer}>
            <span style={{ fontSize: "40px", display: "block", marginBottom: "16px" }}>💬</span>
            目前還沒有任何對話<br/><br/>去配對介面滑動看看吧！
          </div>
        ) : (
          <div className={styles.roomWrapper}>
            {activeRooms.map((room) => {
              const isRoomMatched = room.status === "MATCHED";
              const isRoomClosed = room.status === "CLOSED";

              return (
                <Link href={`/chat/${room.id}`} key={room.id} className={styles.roomItem}>
                  <div className={styles.imgWrapper}>
                    {room.partner.image ? (
                      <img src={room.partner.image} alt="Profile Avatar" className={styles.userImg} />
                    ) : (
                      <div className={styles.userImg} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>👤</div>
                    )}
                    {room.status === "ACTIVE" && <div className={`${styles.dotIndicator} ${styles.dotActive}`} title="倒數中"></div>}
                    {isRoomMatched && <div className={`${styles.dotIndicator} ${styles.dotMatched}`} title="永久好友"></div>}
                  </div>

                  <div className={styles.infoBlock}>
                    <div className={styles.roomHeader}>
                      <h3 className={styles.roomPartnerName}>{room.partner.name || "神祕人"}</h3>
                      <span className={styles.timestampLabel} style={{ color: room.status === "ACTIVE" ? "#f59e0b" : "#888888" }}>
                        {room.lastMessage ? convertISOTime(room.lastMessage.createdAt) : (room.status === "ACTIVE" ? `⏳ ${calculateExpiresIn(room.expiresAt)}` : "")}
                      </span>
                    </div>

                    <p className={styles.lastMsgText} style={{ color: isRoomMatched && !room.lastMessage ? "#10b981" : "#888888" }}>
                      {room.lastMessage ? (
                        <>{room.lastMessage.isMine ? "你: " : ""}{room.lastMessage.content}</>
                      ) : isRoomMatched ? (
                        "🌟 已解鎖永久好友關係"
                      ) : isRoomClosed ? (
                        "🔒 對話已封存"
                      ) : (
                        "建立了一個新的共鳴空間，說聲 Hi 吧！"
                      )}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
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
        <Link href="/" style={{ color: "#888888", textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Disc3 size={28} />
        </Link>
        <Link href="/chat" style={{ color: "#ffffff", textDecoration: "none", display: "flex", alignItems: "center" }}>
          <MessageCircle size={28} />
        </Link>
        <Link href="/profile" style={{ color: "#888888", textDecoration: "none", display: "flex", alignItems: "center" }}>
          <User size={28} />
        </Link>
      </div>
    </div>
  );
}
