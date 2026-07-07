"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { generateEraName } from "@/lib/journey/era-generator";


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

  const [feedbackComment, setFeedbackComment] = useState("");
  const [userWrittenReflection, setUserWrittenReflection] = useState("");
  const [isReflectionExpanded, setIsReflectionExpanded] = useState(false);
  const [isPastReflectionOpened, setIsPastReflectionOpened] = useState(false);

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
            setActiveJournal(data.todayJournal);
            setSelectedFeedback(data.todayJournal.feedback);
            setFeedbackComment((data.todayJournal.evidence as any)?.userFeedbackReason || "");
            setUserWrittenReflection((data.todayJournal.evidence as any)?.userWrittenReflection || "");
            setIsReflectionExpanded(!!(data.todayJournal.evidence as any)?.userWrittenReflection);
            setIsPastReflectionOpened(false);
            
            if (!data.todayJournal.feedback) {
              setIsCuriosityLoop(true);
              setCuriosityStep(1);
            }
          } else if (data.journalTimeline && data.journalTimeline.length > 0) {
            const j = data.journalTimeline[0];
            setActiveJournal(j);
            setSelectedFeedback(j.feedback);
            setFeedbackComment((j.evidence as any)?.userFeedbackReason || "");
            setUserWrittenReflection((j.evidence as any)?.userWrittenReflection || "");
            setIsReflectionExpanded(!!(j.evidence as any)?.userWrittenReflection);
            setIsPastReflectionOpened(false);
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
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isCuriosityLoop, curiosityStep]);

  // Telemetry: 紀錄用戶閱讀日誌的停留時間 (Stay Time)
  useEffect(() => {
    if (!activeJournal) return;
    const startTime = Date.now();
    return () => {
      const durationMs = Date.now() - startTime;
      if (durationMs > 1000) {
        fetch(`/api/journal/${activeJournal.id}/view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ readTimeMs: durationMs })
        }).catch(err => console.error("Telemetry report failed:", err));
      }
    };
  }, [activeJournal?.id]);

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
  
  const bodyParagraphs = activeJournal ? activeJournal.body.split("\n\n").filter(Boolean) : [];

  const submitFeedbackAndReflection = async (option: string | null, comment: string, reflection: string) => {
    if (!activeJournal) return;
    
    setFeedbackStatusMsg("儲存中...");
    
    try {
      const response = await fetch(`/api/journal/${activeJournal.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback: option || "MAYBE",
          comment,
          userWrittenReflection: reflection
        })
      });
      
      if (response.ok) {
        // 更新本地 Timeline 狀態與 evidence
        if (stats.journalTimeline) {
          const updatedTimeline = stats.journalTimeline.map((item: JournalEntry) => {
            if (item.id === activeJournal.id) {
              return {
                ...item,
                feedback: option,
                evidence: {
                  ...item.evidence,
                  userFeedbackReason: comment,
                  userWrittenReflection: reflection
                }
              };
            }
            return item;
          });
          setStats({ ...stats, journalTimeline: updatedTimeline });
        }
        setFeedbackStatusMsg("✓ 感謝你的留言與回饋。");
      } else {
        setFeedbackStatusMsg("儲存失敗，請稍後再試。");
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
    setIsCuriosityLoop(false);
    
    setFeedbackComment((journal.evidence as any)?.userFeedbackReason || "");
    setUserWrittenReflection((journal.evidence as any)?.userWrittenReflection || "");
    setIsReflectionExpanded(!!(journal.evidence as any)?.userWrittenReflection);
    setIsPastReflectionOpened(false);
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
                繼續
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
                {formatDate(activeJournal.date)}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  letterSpacing: "0.05em",
                  marginTop: "0.2rem",
                }}
              >
                ✦ {
                  (() => {
                    const d = new Date(activeJournal.date);
                    const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
                    const stats = {
                      noveltyPercent: activeJournal.evidence?.noveltyPercent,
                      repeatPercent: activeJournal.evidence?.repeatPercent,
                      genresCount: activeJournal.evidence?.genresCount,
                      midnightPercent: activeJournal.evidence?.midnightPercent,
                      peakHour: activeJournal.evidence?.hour
                    };
                    const era = generateEraName(stats, d.getFullYear(), months[d.getMonth()]);
                    return `${era.title}`;
                  })()
                }
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

            {/* 信心佐證顯示 (Confidence Display) */}
            <div
              style={{
                borderTop: "1px solid rgba(234, 229, 224, 0.06)",
                paddingTop: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem"
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
                佐證數據 {`{Evidence}`}
              </span>
              <p
                style={{
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  lineHeight: "1.5",
                  margin: 0,
                  whiteSpace: "pre-line"
                }}
              >
                {(() => {
                  const ev = activeJournal.evidence?.evidence || activeJournal.evidence || {};
                  
                  const header = `今天會出現這段文字，因為：\n`;
                  if (activeJournal.observationId === "obs_novelty_explorer") {
                    return `${header}✓ 過去 30 天內探索新歌\n✓ 第一次播放歌曲比例達 ${ev.noveltyPercent || 0}%`;
                  }
                  if (activeJournal.observationId === "obs_genre_pioneer") {
                    return `${header}✓ 探索多種不同的音樂風格\n✓ 跨足曲風流派達 ${ev.genresCount || 0} 種`;
                  }
                  if (activeJournal.observationId === "obs_repetition_collector") {
                    return `${header}✓ 尋求熟悉旋律的安全感\n✓ 最近 7 天重複播放率達 ${ev.repeatPercent || 0}%`;
                  }
                  if (activeJournal.observationId === "obs_monotonous_comfort") {
                    return `${header}✓ 重複聆聽特定的心靈慰藉\n✓ 重複播放比率達 ${ev.repeatPercent || 0}%\n✓ 單曲循環數達 ${ev.trackCount || 0} 首`;
                  }
                  if (activeJournal.observationId === "obs_temporal_night_owl") {
                    return `${header}✓ 在深夜的萬籟俱寂中聆聽\n✓ 深夜播放比例達 ${ev.midnightPercent || 0}%`;
                  }
                  if (activeJournal.observationId === "obs_moment_early_bird") {
                    return `${header}✓ 伴隨清晨的寧靜開始新的一天\n✓ 播放時間落在清晨 ${ev.hour || 0}:00`;
                  }
                  if (activeJournal.observationId === "obs_moment_first_album") {
                    return `${header}✓ 完整聽完一張專輯\n✓ 沒有跳歌\n✓ 聆聽時長達 ${ev.duration || 0} 分鐘`;
                  }
                  if (activeJournal.observationId === "obs_change_tempo_slowdown") {
                    return `${header}✓ 音樂的步伐顯著放慢\n✓ 音樂速度較上週下降 ${ev.decreasePercent || 0}%`;
                  }
                  if (activeJournal.observationId === "obs_remembering_forgotten") {
                    return `${header}✓ 重新拾起塵封的旋律\n✓ 超過 ${ev.days || 0} 天未播放該曲目\n✓ 歷史播放次數達 ${ev.historyCount || 0} 次`;
                  }
                  if (activeJournal.observationId === "obs_remembering_no_skip_longest") {
                    return `${header}✓ 完整專注地聽完單一歌曲\n✓ 聆聽時長達 ${ev.duration || 0} 分鐘\n✓ 播放過程中沒有跳過`;
                  }
                  if (activeJournal.observationId === "obs_remembering_midnight_isolation") {
                    return `${header}✓ 在午夜時分隻身聆聽特定歌曲\n✓ 深夜播放時間為 ${ev.time || ""}\n✓ 隨後安靜直到天亮`;
                  }
                  if (activeJournal.observationId === "obs_echo_seasonal_return") {
                    return `${header}✓ 在相同的季節重新遇見這首歌\n✓ 歷史播放次數達 ${ev.playCount || 0} 次`;
                  }
                  return `今天會出現這段文字，因為觸發了你最近的聆聽規律。`;
                })()}
              </p>

              {/* 歷史對話 (Cross-Time Dialogue / Past Reflections) */}
              {activeJournal.evidence?.pastReflection && (
                <div style={{ marginTop: "0.5rem" }}>
                  <button
                    onClick={() => setIsPastReflectionOpened(!isPastReflectionOpened)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(234, 229, 224, 0.45)",
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    <span>✦ {activeJournal.evidence.pastReflection.date} 你留過一句話。</span>
                    <span style={{ textDecoration: "underline" }}>{isPastReflectionOpened ? "[收折]" : "[打開]"}</span>
                  </button>
                  {isPastReflectionOpened && (
                    <div style={{
                      marginTop: "0.5rem",
                      padding: "0.75rem 1rem",
                      backgroundColor: "rgba(234, 229, 224, 0.02)",
                      borderLeft: "2px solid rgba(234, 229, 224, 0.15)",
                      fontSize: "0.85rem",
                      fontStyle: "italic",
                      color: "var(--text-secondary)"
                    }}>
                      "{activeJournal.evidence.pastReflection.content}"
                    </div>
                  )}
                </div>
              )}
            </div>

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

            {/* 寫一句話給未來的自己 (Optional Reflection Expandable Input) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {!isReflectionExpanded ? (
                <button
                  onClick={() => setIsReflectionExpanded(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(234, 229, 224, 0.4)",
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "0.8rem",
                    textDecoration: "underline",
                    cursor: "pointer",
                    alignSelf: "center",
                    padding: "0.25rem 0"
                  }}
                >
                  寫一句話給未來的自己
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "var(--font-inter), sans-serif" }}>
                    寫一句話給未來的自己
                  </span>
                  <textarea
                    value={userWrittenReflection}
                    onChange={(e) => setUserWrittenReflection(e.target.value)}
                    placeholder="希望那時候的我..."
                    rows={2}
                    style={{
                      width: "100%",
                      backgroundColor: "var(--card-bg)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--card-border)",
                      borderRadius: "8px",
                      padding: "0.75rem",
                      fontSize: "0.9rem",
                      fontFamily: "var(--font-outfit), sans-serif",
                      resize: "none",
                      outline: "none"
                    }}
                  />
                  <button
                    onClick={() => submitFeedbackAndReflection(selectedFeedback, feedbackComment, userWrittenReflection)}
                    style={{
                      alignSelf: "flex-end",
                      backgroundColor: "var(--text-primary)",
                      color: "var(--bg-color)",
                      border: "none",
                      borderRadius: "16px",
                      padding: "0.4rem 1rem",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    儲存留言
                  </button>
                </div>
              )}
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
                這句說中了嗎？
              </span>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {[
                  { label: "✔ 很像", value: "YES" },
                  { label: "○ 還好", value: "MAYBE" },
                  { label: "✘ 不像", value: "NO" },
                ].map((btn) => {
                  const isSelected = selectedFeedback === btn.value ||
                    (btn.value === "YES" && selectedFeedback === "LIKE") ||
                    (btn.value === "MAYBE" && selectedFeedback === "UNSURE") ||
                    (btn.value === "NO" && selectedFeedback === "DISAGREE");
                  return (
                    <button
                      key={btn.value}
                      onClick={() => {
                        setSelectedFeedback(btn.value);
                        submitFeedbackAndReflection(btn.value, feedbackComment, userWrittenReflection);
                      }}
                      style={{
                        backgroundColor: isSelected ? "var(--text-primary)" : "var(--card-bg)",
                        color: isSelected ? "var(--bg-color)" : "var(--text-primary)",
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
                  );
                })}
              </div>

              {/* 如果選擇「✘ 不像」，顯示選填 textbox */}
              {(selectedFeedback === "NO" || selectedFeedback === "DISAGREE") && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "var(--font-inter), sans-serif" }}>
                    （選填）你想說什麼？
                  </span>
                  <textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="今天只是例外 / 數據對但解讀不對..."
                    rows={2}
                    style={{
                      width: "100%",
                      backgroundColor: "var(--card-bg)",
                      color: "var(--text-primary)",
                      border: "1px solid var(--card-border)",
                      borderRadius: "8px",
                      padding: "0.75rem",
                      fontSize: "0.9rem",
                      fontFamily: "var(--font-outfit), sans-serif",
                      resize: "none",
                      outline: "none"
                    }}
                  />
                  <button
                    onClick={() => submitFeedbackAndReflection(selectedFeedback, feedbackComment, userWrittenReflection)}
                    style={{
                      alignSelf: "flex-end",
                      backgroundColor: "var(--text-primary)",
                      color: "var(--bg-color)",
                      border: "none",
                      borderRadius: "16px",
                      padding: "0.4rem 1rem",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    儲存回饋
                  </button>
                </div>
              )}

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
                const d = new Date(item.date);
                const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
                const stats = {
                  noveltyPercent: item.evidence?.noveltyPercent,
                  repeatPercent: item.evidence?.repeatPercent,
                  genresCount: item.evidence?.genresCount,
                  midnightPercent: item.evidence?.midnightPercent,
                  peakHour: item.evidence?.hour
                };
                const era = generateEraName(stats, d.getFullYear(), months[d.getMonth()]);

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
