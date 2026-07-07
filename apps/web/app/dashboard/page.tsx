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

interface PresentedRevelation {
  id: string;
  title: string;
  introduction: string;
  steps: {
    entityName: string;
    type: string;
    connectionDetails?: {
      relation: string;
      fact: string;
      evidences: readonly {
        factId: string;
        sources: readonly {
          type: string;
          title: string;
          url?: string;
          directness: string;
          retrievedAt?: string;
        }[];
      }[];
    };
  }[];
  score: number;
}

export default function DashboardPage() {
  const { data: userSession, status: authStatus } = useSession();
  const navigation = useRouter();
  const [stats, setStats] = useState<any>(null);
  
  // 驚喜揭露非同步狀態
  const [revelation, setRevelation] = useState<PresentedRevelation | null>(null);
  const [generatedList, setGeneratedList] = useState<PresentedRevelation[]>([]);
  const [alternatives, setAlternatives] = useState<PresentedRevelation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingRevelations, setIsLoadingRevelations] = useState(true);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [expandedAlternativeId, setExpandedAlternativeId] = useState<string | null>(null);
  
  const showLegacyJournal = false;
  
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
      setIsLoadingRevelations(true);
      fetch("/api/revelations")
        .then((res) => res.json())
        .then((payload) => {
          if (payload?.data) {
            setRevelation(payload.data.revelation);
            if (payload.data.revelation) {
              setGeneratedList([payload.data.revelation]);
            }
            setAlternatives(payload.data.alternatives || []);
          }
          setIsLoadingRevelations(false);
        })
        .catch((err) => {
          console.error("Error fetching revelations:", err);
          setIsLoadingRevelations(false);
        });
    }
  }, [authStatus]);

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

  const handleGenerateMore = async () => {
    setIsLoadingRevelations(true);
    try {
      const response = await fetch("/api/revelations?regenerate=true");
      const payload = await response.json();
      if (payload?.data?.revelation) {
        const newRev = payload.data.revelation;
        setGeneratedList((prev) => {
          if (prev.some((item) => item.id === newRev.id)) {
            return prev;
          }
          return [...prev, newRev];
        });
        if (payload.data.alternatives) {
          setAlternatives(payload.data.alternatives);
        }
      }
    } catch (err) {
      console.error("Error generating more revelations:", err);
    } finally {
      setIsLoadingRevelations(false);
    }
  };

  const removeGeneratedCard = (id: string) => {
    setGeneratedList((prev) => prev.filter((item) => item.id !== id));
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

        {/* Today's Discovery Card */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
            animation: "fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {isLoadingRevelations ? (
            /* Loading Skeleton */
            <div
              style={{
                backgroundColor: "rgba(234, 229, 224, 0.02)",
                border: "1px solid rgba(234, 229, 224, 0.08)",
                borderRadius: "24px",
                padding: "2.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
                backdropFilter: "blur(4px)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ width: "120px", height: "16px", backgroundColor: "rgba(234, 229, 224, 0.05)", borderRadius: "4px" }} />
                <div style={{ width: "80px", height: "16px", backgroundColor: "rgba(234, 229, 224, 0.05)", borderRadius: "100px" }} />
              </div>
              <div style={{ height: "100px", backgroundColor: "rgba(234, 229, 224, 0.03)", borderRadius: "16px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>正在從你的聆聽歷史中尋索驚喜發現...</span>
              </div>
            </div>
          ) : generatedList.length === 0 ? (
            /* No Revelation Fallback */
            <div
              style={{
                backgroundColor: "rgba(234, 229, 224, 0.02)",
                border: "1px solid rgba(234, 229, 224, 0.08)",
                borderRadius: "24px",
                padding: "2.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
                backdropFilter: "blur(4px)",
                textAlign: "center"
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>🧩</span>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0 }}>
                你最近的聆聽歷史較為單一，目前尚無足夠的跨界連通線索。
              </p>
            </div>
          ) : (
            /* Multiple Generated Cards Column */
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", width: "100%" }}>
              {generatedList.map((rev, revIdx) => (
                <div
                  key={rev.id + revIdx}
                  style={{
                    backgroundColor: "rgba(234, 229, 224, 0.02)",
                    border: "1px solid rgba(234, 229, 224, 0.08)",
                    borderRadius: "24px",
                    padding: "2.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2rem",
                    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
                    backdropFilter: "blur(4px)",
                    position: "relative",
                    animation: "fadeIn 0.5s ease-out",
                  }}
                >
                  {/* Close Card Button */}
                  {generatedList.length > 1 && (
                    <button
                      onClick={() => removeGeneratedCard(rev.id)}
                      style={{
                        position: "absolute",
                        top: "1.25rem",
                        right: "1.25rem",
                        background: "transparent",
                        border: "none",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        opacity: 0.5,
                        transition: "opacity 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
                      title="關閉此揭露"
                    >
                      ✕
                    </button>
                  )}

                  {/* Card Title */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                        letterSpacing: "0.15em",
                        fontWeight: 500,
                        textTransform: "uppercase",
                      }}
                    >
                      🎧 Discovery Path #{revIdx + 1}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: "0.7rem",
                        color: "rgba(234, 229, 224, 0.6)",
                        border: "1px solid rgba(234, 229, 224, 0.15)",
                        borderRadius: "100px",
                        padding: "0.2rem 0.6rem",
                      }}
                    >
                      Curiosity Score: {Math.round(rev.score * 100)}%
                    </span>
                  </div>

                  {/* Connection Path Visualization */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "1.5rem 0",
                      backgroundColor: "rgba(234, 229, 224, 0.01)",
                      borderRadius: "16px",
                      border: "1px solid rgba(234, 229, 224, 0.03)",
                    }}
                  >
                    {rev.steps.map((node, index) => (
                      <div
                        key={node.entityName + index}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-outfit), sans-serif",
                              fontSize: "1.15rem",
                              fontWeight: index === rev.steps.length - 1 ? 400 : 300,
                              color: index === rev.steps.length - 1 ? "var(--text-primary)" : "var(--text-secondary)",
                              letterSpacing: "0.02em",
                            }}
                          >
                            {node.entityName}
                          </span>
                          <span
                            style={{
                              fontSize: "0.65rem",
                              color: "rgba(234, 229, 224, 0.3)",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              marginTop: "0.1rem"
                            }}
                          >
                            {node.type}
                          </span>
                        </div>

                        {index < rev.steps.length - 1 && (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "0.2rem 0" }}>
                            <span
                              style={{
                                color: "rgba(234, 229, 224, 0.25)",
                                fontSize: "0.8rem",
                                fontFamily: "var(--font-inter), sans-serif",
                              }}
                            >
                              ↓
                            </span>
                            {rev.steps[index + 1]?.connectionDetails && (
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  color: "rgba(234, 229, 224, 0.4)",
                                  fontStyle: "italic",
                                  textAlign: "center",
                                  maxWidth: "280px",
                                  margin: "0.1rem 0"
                                }}
                              >
                                {rev.steps[index + 1].connectionDetails?.relation}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div style={{ height: "1px", backgroundColor: "rgba(234, 229, 224, 0.06)" }} />

                  {/* Story Title & Summary */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <h3
                      style={{
                        fontFamily: "var(--font-outfit), sans-serif",
                        fontSize: "1.25rem",
                        fontWeight: 400,
                        margin: 0,
                        color: "var(--text-primary)"
                      }}
                    >
                      {rev.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "var(--font-outfit), sans-serif",
                        fontSize: "1.02rem",
                        fontWeight: 300,
                        lineHeight: "1.7",
                        color: "var(--text-secondary)",
                        margin: 0,
                        letterSpacing: "0.01em",
                        whiteSpace: "pre-line",
                      }}
                    >
                      {rev.introduction}
                    </p>
                    
                    {/* Dynamically build narration based on path facts */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "0.5rem" }}>
                      {rev.steps.map((step, idx) => {
                        if (!step.connectionDetails) return null;
                        return (
                          <div
                            key={idx}
                            style={{
                              fontSize: "0.9rem",
                              backgroundColor: "rgba(234, 229, 224, 0.01)",
                              borderLeft: "2px solid rgba(234, 229, 224, 0.15)",
                              padding: "0.5rem 0.75rem",
                              borderRadius: "0 8px 8px 0"
                            }}
                          >
                            <span style={{ color: "var(--text-primary)", fontWeight: 400 }}>{step.entityName}</span>:{" "}
                            <span style={{ color: "var(--text-secondary)", fontWeight: 300 }}>{step.connectionDetails.fact}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: "1px", backgroundColor: "rgba(234, 229, 224, 0.06)" }} />

                  {/* Sources */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-inter), sans-serif",
                        fontSize: "0.7rem",
                        color: "var(--text-secondary)",
                        letterSpacing: "0.1em",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      Sources {`{圖譜信賴來源}`}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {rev.steps.map((s, sIdx) => {
                        if (!s.connectionDetails?.evidences) return null;
                        return s.connectionDetails.evidences.map((ev, evIdx) => (
                          <div key={`${sIdx}-${evIdx}`} style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                            {ev.sources.map((src: any, srcIdx) => {
                              const hasUrl = !!src.url;
                              const availability = src.status?.availability || "Unknown";
                              const statusDot = 
                                availability === "Live" ? "🟢" :
                                availability === "Archived" ? "🟡" :
                                availability === "Dead" ? "🔴" : "⚪";
                              const isDead = availability === "Dead";
                              
                              return (
                                <div
                                  key={srcIdx}
                                  style={{
                                    display: "flex",
                                    alignItems: "baseline",
                                    gap: "0.4rem",
                                    fontFamily: "var(--font-inter), sans-serif",
                                    fontSize: "0.78rem",
                                    color: "var(--text-secondary)",
                                    lineHeight: "1.4"
                                  }}
                                >
                                  <span style={{ fontSize: "0.65rem", marginRight: "0.15rem" }} title={`來源存活狀態: ${availability}`}>
                                    {statusDot}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.65rem",
                                      color: "rgba(234, 229, 224, 0.4)",
                                      border: "1px solid rgba(234, 229, 224, 0.12)",
                                      borderRadius: "3px",
                                      padding: "0.05rem 0.25rem",
                                      textTransform: "uppercase",
                                      fontWeight: 500
                                    }}
                                  >
                                    {src.type}
                                  </span>
                                  {hasUrl ? (
                                    <a
                                      href={src.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        color: isDead ? "rgba(234, 229, 224, 0.45)" : "var(--text-primary)",
                                        textDecoration: isDead ? "line-through underline" : "underline",
                                        textUnderlineOffset: "3px",
                                        transition: "color 0.2s ease"
                                      }}
                                    >
                                      {src.title} ↗
                                    </a>
                                  ) : (
                                    <span style={{ color: isDead ? "rgba(234, 229, 224, 0.45)" : "inherit", textDecoration: isDead ? "line-through" : "none" }}>
                                      {src.title} {isDead && "(無法存取)"}
                                    </span>
                                  )}
                                  {src.archive && (
                                    <span style={{ fontSize: "0.72rem", color: "rgba(234, 229, 224, 0.45)", marginLeft: "0.15rem" }}>
                                      (
                                      <a
                                        href={src.archive.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          color: "rgba(234, 229, 224, 0.65)",
                                          textDecoration: "underline",
                                          textUnderlineOffset: "2px"
                                        }}
                                        title={`備份服務: ${src.archive.provider} | 備份時間: ${src.archive.capturedAt}${src.archive.snapshotId ? ` | 快照ID: ${src.archive.snapshotId}` : ""}`}
                                      >
                                        備份 ↗
                                      </a>
                                      )
                                    </span>
                                  )}
                                  <span style={{ fontSize: "0.7rem", color: "rgba(234, 229, 224, 0.25)" }}>
                                    ({src.directness === "Primary" ? "直接證據" : "次要證據"})
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ));
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Action Button Container (Placed at bottom of card column) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: "1rem",
                  width: "100%",
                  marginTop: "0.5rem",
                }}
              >
                {/* Generate More Button */}
                <button
                  disabled={isLoadingRevelations}
                  style={{
                    padding: "0.75rem 2rem",
                    borderRadius: "100px",
                    border: "1px solid rgba(234, 229, 224, 0.15)",
                    backgroundColor: "transparent",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "0.85rem",
                    fontWeight: 400,
                    cursor: isLoadingRevelations ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                    letterSpacing: "0.05em",
                    opacity: isLoadingRevelations ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoadingRevelations) {
                      e.currentTarget.style.backgroundColor = "rgba(234, 229, 224, 0.05)";
                      e.currentTarget.style.borderColor = "var(--text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoadingRevelations) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.borderColor = "rgba(234, 229, 224, 0.15)";
                    }
                  }}
                  onClick={handleGenerateMore}
                >
                  {isLoadingRevelations ? "Shuffling... 🔮" : "Generate 🔮"}
                </button>

                {/* Explore Alternatives Button */}
                {alternatives.length > 0 && (
                  <button
                    style={{
                      padding: "0.75rem 2rem",
                      borderRadius: "100px",
                      border: showAlternatives ? "1px solid var(--text-primary)" : "1px solid rgba(234, 229, 224, 0.15)",
                      backgroundColor: showAlternatives ? "rgba(234, 229, 224, 0.05)" : "transparent",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-inter), sans-serif",
                      fontSize: "0.85rem",
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
                      if (!showAlternatives) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.borderColor = "rgba(234, 229, 224, 0.15)";
                      }
                    }}
                    onClick={() => setShowAlternatives(!showAlternatives)}
                  >
                    {showAlternatives ? "Close Alternatives ↑" : `Explore Alternatives (${alternatives.length}) →`}
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Alternatives (Rabbit Hole) Panel */}
        {showAlternatives && alternatives.length > 0 && (() => {
          // 按照第一個 Known Artist 節點進行分組
          const grouped: Record<string, PresentedRevelation[]> = {};
          alternatives.forEach((alt) => {
            const artistGroup = alt.steps[0]?.entityName || "其他線索";
            if (!grouped[artistGroup]) {
              grouped[artistGroup] = [];
            }
            grouped[artistGroup].push(alt);
          });

          // 模糊搜尋過濾
          const query = searchQuery.trim().toLowerCase();
          const filteredGroups = Object.keys(grouped).reduce((acc, artistName) => {
            if (!query) {
              acc[artistName] = grouped[artistName];
              return acc;
            }
            const matchesArtist = artistName.toLowerCase().includes(query);
            const matchingPaths = grouped[artistName].filter((alt) => {
              const matchesTitle = alt.title.toLowerCase().includes(query);
              const matchesSteps = alt.steps.some((step) =>
                step.entityName.toLowerCase().includes(query)
              );
              return matchesTitle || matchesSteps;
            });
            if (matchesArtist || matchingPaths.length > 0) {
              acc[artistName] = matchesArtist ? grouped[artistName] : matchingPaths;
            }
            return acc;
          }, {} as Record<string, PresentedRevelation[]>);

          const totalFilteredPaths = Object.values(filteredGroups).reduce((sum, list) => sum + list.length, 0);

          return (
            <section
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                marginTop: "-2rem",
                animation: "fadeIn 0.4s ease-out",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 0.5rem" }}>
                <span
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    letterSpacing: "0.1em",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  🕳️ Music Rabbit Holes {`{其餘關聯線索}`}
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontFamily: "var(--font-inter), sans-serif" }}>
                  共 {totalFilteredPaths} 條符合
                </span>
              </div>

              {/* Search Bar */}
              <div style={{ padding: "0 0.5rem" }}>
                <input
                  type="text"
                  placeholder="搜尋藝人、歌名或音樂事件..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1.25rem",
                    borderRadius: "12px",
                    border: "1px solid rgba(234, 229, 224, 0.08)",
                    backgroundColor: "rgba(234, 229, 224, 0.02)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "0.85rem",
                    outline: "none",
                    transition: "all 0.3s ease",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(234, 229, 224, 0.3)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(234, 229, 224, 0.08)")}
                />
              </div>

              {/* Grouped Artist Panels */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {Object.keys(filteredGroups).map((artistName) => {
                  const pathsInGroup = filteredGroups[artistName];
                  if (pathsInGroup.length === 0) return null;

                  return (
                    <div key={artistName} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0 0.5rem" }}>
                      {/* Group Header */}
                      <div
                        style={{
                          fontFamily: "var(--font-outfit), sans-serif",
                          fontSize: "0.95rem",
                          fontWeight: 400,
                          color: "var(--text-primary)",
                          borderBottom: "1px solid rgba(234, 229, 224, 0.06)",
                          paddingBottom: "0.4rem",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <span>🎤 {artistName}</span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontFamily: "var(--font-inter), sans-serif" }}>
                          {pathsInGroup.length} 條線索
                        </span>
                      </div>

                      {/* Paths List in Group */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {pathsInGroup.map((alt) => {
                          const isExpanded = expandedAlternativeId === alt.id;
                          return (
                            <div
                              key={alt.id}
                              style={{
                                backgroundColor: "rgba(234, 229, 224, 0.01)",
                                border: "1px solid rgba(234, 229, 224, 0.04)",
                                borderRadius: "16px",
                                padding: "1.25rem",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                              }}
                              onClick={() => setExpandedAlternativeId(isExpanded ? null : alt.id)}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h4
                                  style={{
                                    fontFamily: "var(--font-outfit), sans-serif",
                                    fontSize: "0.92rem",
                                    fontWeight: 400,
                                    margin: 0,
                                    color: "var(--text-secondary)"
                                  }}
                                >
                                  {alt.title}
                                </h4>
                                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                                  {isExpanded ? "[收折 ↑]" : "[展開 ↓]"}
                                </span>
                              </div>
                              
                              {isExpanded && (
                                <div
                                  style={{
                                    marginTop: "1rem",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "1rem",
                                    borderTop: "1px solid rgba(234, 229, 224, 0.05)",
                                    paddingTop: "1rem",
                                    animation: "fadeIn 0.2s ease"
                                  }}
                                  onClick={(e) => e.stopPropagation()} // 避免觸發收折
                                >
                                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
                                    {alt.introduction}
                                  </p>
                                  
                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    {alt.steps.map((step, idx) => (
                                      <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.15rem", paddingLeft: "0.5rem" }}>
                                        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                                          <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 400 }}>
                                            {idx > 0 ? "↓ " : ""}{step.entityName}
                                          </span>
                                          <span style={{ fontSize: "0.6rem", color: "rgba(234, 229, 224, 0.3)" }}>
                                            ({step.type})
                                          </span>
                                        </div>
                                        {step.connectionDetails && (
                                          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", paddingLeft: "1rem", marginTop: "0.15rem" }}>
                                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                                              ↳ {step.connectionDetails.fact}
                                            </div>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.05rem" }}>
                                              {step.connectionDetails.evidences?.flatMap(ev => ev.sources).map((src: any, srcIdx) => {
                                                 const availability = src.status?.availability || "Unknown";
                                                 const statusDot = 
                                                   availability === "Live" ? "🟢" :
                                                   availability === "Archived" ? "🟡" :
                                                   availability === "Dead" ? "🔴" : "⚪";
                                                 const isDead = availability === "Dead";
                                                 
                                                 return (
                                                   <span key={srcIdx} style={{ fontSize: "0.7rem", color: isDead ? "rgba(234, 229, 224, 0.35)" : "rgba(234, 229, 224, 0.45)", display: "inline-flex", alignItems: "baseline", gap: "0.2rem" }}>
                                                     <span>{statusDot}</span>
                                                     <span style={{ fontSize: "0.65rem", color: "rgba(234, 229, 224, 0.3)" }}>[{src.type}]</span>
                                                     {src.url ? (
                                                       <a
                                                         href={src.url}
                                                         target="_blank"
                                                         rel="noopener noreferrer"
                                                         style={{
                                                           textDecoration: "underline",
                                                           color: "inherit",
                                                           textDecorationLine: isDead ? "line-through underline" : "underline"
                                                         }}
                                                       >
                                                         {src.title} ↗
                                                       </a>
                                                      ) : (
                                                       <span style={{ textDecoration: isDead ? "line-through" : "none" }}>{src.title}</span>
                                                      )}
                                                      {src.archive && (
                                                        <a
                                                          href={src.archive.url}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          style={{
                                                            color: "rgba(234, 229, 224, 0.55)",
                                                            textDecoration: "underline",
                                                            fontSize: "0.68rem"
                                                          }}
                                                          title={`備份: ${src.archive.provider} | ${src.archive.capturedAt}`}
                                                        >
                                                          (備份 ↗)
                                                        </a>
                                                      )}
                                                   </span>
                                                 );
                                               })}</div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* 1. Curiosity Loop (開場引導狀態) */}
        {showLegacyJournal && isCuriosityLoop && activeJournal && bodyParagraphs.length >= 3 && (
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
        {showLegacyJournal && !isCuriosityLoop && activeJournal && (
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
        {showLegacyJournal && timeline.length > 0 && (
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
