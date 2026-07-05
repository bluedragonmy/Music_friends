"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface JournalEntry {
  id: string;
  date: string;
  observationId: string;
  title: string;
  body: string;
  evidence: Record<string, any> | null;
  reflection: string;
  feedback: string | null;
}

export default function DashboardPage() {
  const { data: userSession, status: authStatus } = useSession();
  const navigation = useRouter();
  const [stats, setStats] = useState<any>(null);
  
  // UX 狀態控制
  const [activeJournal, setActiveJournal] = useState<JournalEntry | null>(null);
  const [isCuriosityLoop, setIsCuriosityLoop] = useState(false);
  const [curiosityStep, setCuriosityStep] = useState(0);
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [feedbackStatusMsg, setFeedbackStatusMsg] = useState("");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      navigation.push("/");
    }
  }, [authStatus, navigation]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetch("/api/stats?dimension=week")
        .then((res) => res.json())
        .then((data) => {
          setStats(data);
          
          if (data.todayJournal) {
            // 如果有今天的日誌
            setActiveJournal(data.todayJournal);
            setSelectedFeedback(data.todayJournal.feedback);
            
            // 檢查是否為首次產生的日誌 (例如 feedback 尚未設定，或是可以依據時間戳記判斷)
            // 為了好的體驗，我們預設只要有今天日誌就啟動 Curiosity Loop 引導
            if (!data.todayJournal.feedback) {
              setIsCuriosityLoop(true);
              setCuriosityStep(1);
            }
          } else if (data.journalTimeline && data.journalTimeline.length > 0) {
            // 如果今天還沒有日誌，但有歷史日誌，預設顯示最新的一筆
            setActiveJournal(data.journalTimeline[0]);
            setSelectedFeedback(data.journalTimeline[0].feedback);
          }
        })
        .catch((err) => console.error("Error fetching stats:", err));
    }
  }, [authStatus]);

  // Curiosity Loop 自動淡入控制
  useEffect(() => {
    if (isCuriosityLoop && curiosityStep > 0 && curiosityStep < 3) {
      const timer = setTimeout(() => {
        setCuriosityStep((prev) => prev + 1);
      }, 2500); // 每段間隔 2.5 秒
      return () => clearTimeout(timer);
    }
  }, [isCuriosityLoop, curiosityStep]);

  if (authStatus === "loading" || !stats) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-color)", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <p style={{ color: "var(--text-secondary)", fontFamily: "var(--font-inter), sans-serif", fontSize: "0.9rem" }}>
          正在讀取你的聆聽時光...
        </p>
      </div>
    );
  }

  const displayName = userSession?.user?.name || "Music Lover";
  const timeline: JournalEntry[] = stats.journalTimeline || [];
  
  // 將日誌的 body 文字段落拆開，用於好奇心引導
  const bodyParagraphs = activeJournal ? activeJournal.body.split("\n\n").filter(Boolean) : [];

  const handleFeedback = async (option: "LIKE" | "UNSURE" | "DISAGREE") => {
    if (!activeJournal) return;
    
    setSelectedFeedback(option);
    setFeedbackStatusMsg("儲存中...");
    
    try {
      const response = await fetch(`/api/journal/${activeJournal.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: option })
      });
      
      const resData = await response.json();
      if (response.ok) {
        // 更新本地 Timeline 狀態
        if (stats.journalTimeline) {
          const updatedTimeline = stats.journalTimeline.map((item: JournalEntry) => {
            if (item.id === activeJournal.id) {
              return { ...item, feedback: option };
            }
            return item;
          });
          setStats({ ...stats, journalTimeline: updatedTimeline });
        }
        
        // 顯示感謝文案
        const thankYouTexts = {
          LIKE: "👍 很高興我們能捕捉到你的狀態。",
          UNSURE: "🤔 沒關係，旋律的意義有時需要時間沉澱。",
          DISAGREE: "❌ 謝謝你的直率，我們會調整觀察規則。"
        };
        setFeedbackStatusMsg(thankYouTexts[option]);
      } else {
        setFeedbackStatusMsg("反饋提交失敗，請稍後再試。");
      }
    } catch (err) {
      console.error("Feedback submit error:", err);
      setFeedbackStatusMsg("連線失敗。");
    }
  };

  const selectHistoryJournal = (journal: JournalEntry) => {
    setActiveJournal(journal);
    setSelectedFeedback(journal.feedback);
    setFeedbackStatusMsg("");
    setIsCuriosityLoop(false); // 點擊歷史紀錄直接跳過好奇心引導
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("zh-TW", { month: "long", day: "numeric" });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-color)",
        color: "var(--text-primary)",
        padding: "6rem 1.5rem 8rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "4rem",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderBottom: "1px solid rgba(234, 229, 224, 0.08)",
            paddingBottom: "1.5rem",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontSize: "1.25rem",
              fontWeight: 300,
              letterSpacing: "-0.02em",
            }}
          >
            μ(sic)
          </span>
          <span
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              letterSpacing: "0.05em",
            }}
          >
            LISTENING JOURNEY FOR {displayName.toUpperCase()}
          </span>
        </header>

        {/* 1. Curiosity Loop (開場引導狀態) */}
        {isCuriosityLoop && activeJournal && bodyParagraphs.length >= 3 && (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minHeight: "260px",
              gap: "2.5rem",
              animation: "fadeIn 0.5s ease",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {curiosityStep >= 1 && (
                <p
                  style={{
                    fontFamily: "var(--font-outfit), sans-serif",
                    fontSize: "1.1rem",
                    fontWeight: 300,
                    lineHeight: "1.6",
                    color: "var(--text-primary)",
                    margin: 0,
                    opacity: 1,
                    transition: "opacity 0.8s ease",
                  }}
                >
                  {bodyParagraphs[0]}
                </p>
              )}

              {curiosityStep >= 2 && (
                <p
                  style={{
                    fontFamily: "var(--font-outfit), sans-serif",
                    fontSize: "1.1rem",
                    fontWeight: 400,
                    lineHeight: "1.6",
                    color: "var(--text-primary)",
                    margin: 0,
                    opacity: 1,
                    transition: "opacity 0.8s ease",
                  }}
                >
                  {bodyParagraphs[1]}
                </p>
              )}

              {curiosityStep >= 3 && (
                <p
                  style={{
                    fontFamily: "var(--font-outfit), sans-serif",
                    fontSize: "1.1rem",
                    fontWeight: 300,
                    lineHeight: "1.6",
                    color: "var(--text-secondary)",
                    margin: 0,
                    fontStyle: "italic",
                    opacity: 1,
                    transition: "opacity 0.8s ease",
                  }}
                >
                  {bodyParagraphs[2]}
                </p>
              )}
            </div>

            {curiosityStep >= 3 && (
              <button
                onClick={() => setIsCuriosityLoop(false)}
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "var(--text-primary)",
                  color: "var(--bg-color)",
                  border: "none",
                  borderRadius: "24px",
                  padding: "0.6rem 1.5rem",
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "opacity 0.3s ease",
                  opacity: 0.9,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
              >
                開啟今日日誌
              </button>
            )}
          </section>
        )}

        {/* 2. Journal Card (已解鎖呈現狀態) */}
        {!isCuriosityLoop && activeJournal && (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2.5rem",
              animation: "fadeIn 0.5s ease",
            }}
          >
            {/* 日誌日期與標題 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {formatDate(activeJournal.date)} 的觀察
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontSize: "1.75rem",
                  fontWeight: 300,
                  margin: 0,
                }}
              >
                {activeJournal.title}
              </h2>
            </div>

            {/* 日誌內文 */}
            <div
              style={{
                fontFamily: "var(--font-outfit), sans-serif",
                fontSize: "1rem",
                fontWeight: 300,
                lineHeight: "1.7",
                color: "var(--text-primary)",
                display: "flex",
                flexDirection: "column",
                gap: "1.2rem",
              }}
            >
              {bodyParagraphs.map((p, idx) => (
                <p key={idx} style={{ margin: 0 }}>
                  {p}
                </p>
              ))}
            </div>

            {/* 物理證據指標 (Evidence Section - Optional) */}
            {activeJournal.evidence && Object.keys(activeJournal.evidence).length > 0 && (
              <div
                style={{
                  borderTop: "1px solid rgba(234, 229, 224, 0.06)",
                  paddingTop: "1.5rem",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "0.7rem",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  物理證據數據 {`{Evidence}`}
                </span>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "1.5rem",
                    marginTop: "0.75rem",
                  }}
                >
                  {Object.entries(activeJournal.evidence).map(([key, val]) => (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.15rem",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-inter), sans-serif",
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {key === "noveltyPercent" ? "新歌比率" : key === "repeatPercent" ? "重複率" : key === "genresCount" ? "曲風數量" : key === "trackCount" ? "重複曲目數" : key === "hour" ? "聽歌時段" : key}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-outfit), sans-serif",
                          fontSize: "1.1rem",
                          fontWeight: 400,
                        }}
                      >
                        {key === "hour" ? `${val}:00` : typeof val === "number" && key.endsWith("Percent") ? `${val}%` : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 深層反思 (Reflection Section) */}
            <div
              style={{
                padding: "1.5rem",
                borderRadius: "16px",
                backgroundColor: "rgba(234, 229, 224, 0.03)",
                border: "1px solid rgba(234, 229, 224, 0.05)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "0.65rem",
                  color: "var(--text-secondary)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                留下反思 {`{Reflection}`}
              </span>
              <p
                style={{
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontSize: "0.95rem",
                  fontWeight: 300,
                  lineHeight: "1.5",
                  color: "var(--text-primary)",
                  margin: 0,
                  fontStyle: "italic",
                  textAlign: "center",
                }}
              >
                "{activeJournal.reflection}"
              </p>
            </div>

            {/* 反饋互動 (Feedback Loop) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
                borderTop: "1px solid rgba(234, 229, 224, 0.06)",
                paddingTop: "1.5rem",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-inter), sans-serif",
                  fontSize: "0.7rem",
                  color: "var(--text-secondary)",
                  letterSpacing: "0.05em",
                }}
              >
                這篇日誌對你而言真實嗎？
              </span>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {[
                  { label: "👍 很像我", value: "LIKE" },
                  { label: "🤔 不太確定", value: "UNSURE" },
                  { label: "👎 我不同意", value: "DISAGREE" },
                ].map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => handleFeedback(btn.value as any)}
                    style={{
                      backgroundColor: selectedFeedback === btn.value ? "var(--text-primary)" : "var(--card-bg)",
                      color: selectedFeedback === btn.value ? "var(--bg-color)" : "var(--text-primary)",
                      border: "1px solid var(--card-border)",
                      borderRadius: "20px",
                      padding: "0.5rem 1rem",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              {feedbackStatusMsg && (
                <span
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    fontStyle: "italic",
                    marginTop: "0.25rem",
                  }}
                >
                  {feedbackStatusMsg}
                </span>
              )}
            </div>
          </section>
        )}

        {/* 3. Listening Journey Timeline (旅程時間軸) */}
        {timeline.length > 0 && (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
              borderTop: "1px solid rgba(234, 229, 224, 0.08)",
              paddingTop: "3rem",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-outfit), sans-serif",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "var(--text-secondary)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              Listening Journey {`{聆聽旅程}`}
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                position: "relative",
                paddingLeft: "1.5rem",
                gap: "1.5rem",
              }}
            >
              {/* 時間軸垂直線 */}
              <div
                style={{
                  position: "absolute",
                  left: "4px",
                  top: "0.5rem",
                  bottom: "0.5rem",
                  width: "1px",
                  backgroundColor: "rgba(234, 229, 224, 0.12)",
                }}
              />

              {timeline.map((item) => {
                const isActive = activeJournal && activeJournal.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => selectHistoryJournal(item)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    {/* 時間軸節點圓點 */}
                    <div
                      style={{
                        position: "absolute",
                        left: "-23px",
                        top: "4px",
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        backgroundColor: isActive ? "var(--text-primary)" : "rgba(234, 229, 224, 0.3)",
                        border: isActive ? "3px solid var(--bg-color)" : "none",
                        outline: isActive ? "1px solid var(--text-primary)" : "none",
                        transition: "all 0.2s ease",
                      }}
                    />

                    <span
                      style={{
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: "0.75rem",
                        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                        fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      {formatDate(item.date)}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-outfit), sans-serif",
                        fontSize: "0.95rem",
                        color: isActive ? "var(--text-primary)" : "rgba(234, 229, 224, 0.6)",
                        fontWeight: isActive ? 400 : 300,
                        marginTop: "0.15rem",
                      }}
                    >
                      {item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer
          style={{
            marginTop: "2rem",
            display: "flex",
            justifyContent: "center",
            borderTop: "1px solid rgba(234, 229, 224, 0.08)",
            paddingTop: "2rem",
          }}
        >
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              fontSize: "0.8rem",
              cursor: "pointer",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              padding: "0.5rem 1rem",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            Disconnect Session
          </button>
        </footer>
      </div>
      
      {/* 簡單的開場動畫 CSS */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
