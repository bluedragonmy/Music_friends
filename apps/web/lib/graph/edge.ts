// =============================================================================
// Edge — Music Knowledge Graph 的邊定義
// =============================================================================

/**
 * 圖譜中支援的關係類別。
 *
 * 每種 EdgeType 代表一種可查證的真實關係。
 */
export type EdgeType =
  | "PRODUCED"            // 製作了（Producer → Song / Album）
  | "WROTE"               // 創作了（Artist / Producer → Song）
  | "FEATURED"            // 參與了（Artist → Song，作為 featuring）
  | "SIGNED_TO"           // 簽約於（Artist → Label）
  | "INFLUENCED"          // 影響了（Artist → Artist）
  | "COLLABORATED_WITH"   // 合作過（Artist ↔ Artist / Producer）
  | "APPEARED_AT"         // 出現在（Artist / Producer → Event）
  | "MENTIONED_IN";       // 被提及（Entity → Event，例如在採訪中被提到）

/**
 * 事實的來源類別。
 *
 * 未來 Discovery 卡片可以直接顯示 Sources，
 * 讓使用者相信的不是 AI，而是「我可以自己去查」。
 */
export type FactSource =
  | "Wikipedia"
  | "Podcast"
  | "Billboard"
  | "YouTube"
  | "Interview"
  | "Instagram"
  | "Credits"
  | "Press Release"
  | "Award Show"
  | "News Article";

/**
 * 圖譜中的一條邊。
 *
 * Rule Zero 的核心：每條 Edge 都必須附帶一個 `fact` —
 * 一段可查證的事實描述，而不是 AI 生成的故事。
 *
 * `factSource` 告訴使用者這個事實從哪裡來。
 */
export interface Edge {
  readonly source: string;         // 來源 Entity ID
  readonly target: string;         // 目標 Entity ID
  readonly type: EdgeType;         // 關係類別
  readonly fact: string;           // 可查證的事實描述
  readonly factSource: FactSource; // 事實的來源
}

/** 建立一條 Edge，提供型別安全的工廠函式。 */
export function createEdge(
  source: string,
  target: string,
  type: EdgeType,
  fact: string,
  factSource: FactSource,
): Edge {
  return { source, target, type, fact, factSource };
}

// =============================================================================
// Seed Data — 硬編碼的真實關係事實
// =============================================================================

export const SEED_EDGES: readonly Edge[] = [
  // === Charlie Puth ↔ Event ↔ 250 ↔ NewJeans 路徑 ===
  // 忠於事實：Charlie Puth 沒有直接跟 250 合作，而是透過 Podcast 揭露他寄過 demo 給 250
  createEdge(
    "charlie_puth", "charlie_puth_demo_to_250", "APPEARED_AT",
    "Charlie Puth revealed on a podcast that he sent demos to producer 250",
    "Podcast",
  ),
  createEdge(
    "250", "charlie_puth_demo_to_250", "MENTIONED_IN",
    "Producer 250 was named as the recipient of Charlie Puth's demo submissions",
    "Podcast",
  ),
  // 250 ↔ NewJeans 的真實關聯
  createEdge(
    "250", "attention", "PRODUCED",
    "250 produced NewJeans' debut single 'Attention' (2022)",
    "Credits",
  ),
  createEdge(
    "250", "hype_boy", "PRODUCED",
    "250 produced NewJeans' 'Hype Boy' (2022)",
    "Credits",
  ),
  createEdge(
    "newjeans", "250", "COLLABORATED_WITH",
    "250 is NewJeans' primary producer, credited on all major singles since debut (2022)",
    "Credits",
  ),

  // === Taylor Swift ↔ Jack Antonoff ↔ Lorde 路徑 ===
  createEdge(
    "jack_antonoff", "1989", "PRODUCED",
    "Jack Antonoff co-produced Taylor Swift's album '1989' (2014)",
    "Credits",
  ),
  createEdge(
    "jack_antonoff", "melodrama", "PRODUCED",
    "Jack Antonoff co-produced Lorde's album 'Melodrama' (2017)",
    "Credits",
  ),
  createEdge(
    "jack_antonoff", "pure_heroine", "PRODUCED",
    "Jack Antonoff co-produced Lorde's album 'Pure Heroine' (2013)",
    "Credits",
  ),
  createEdge(
    "taylor_swift", "jack_antonoff", "COLLABORATED_WITH",
    "Taylor Swift and Jack Antonoff have collaborated extensively since '1989' (2014)",
    "Wikipedia",
  ),
  createEdge(
    "lorde", "jack_antonoff", "COLLABORATED_WITH",
    "Lorde and Jack Antonoff collaborated on 'Pure Heroine' (2013) and 'Melodrama' (2017)",
    "Wikipedia",
  ),

  // === Artist ↔ Song / Album 關係 ===
  createEdge(
    "newjeans", "attention", "FEATURED",
    "NewJeans performed 'Attention' as their debut single (2022)",
    "Credits",
  ),
  createEdge(
    "newjeans", "hype_boy", "FEATURED",
    "NewJeans performed 'Hype Boy' from their debut EP (2022)",
    "Credits",
  ),
  createEdge(
    "taylor_swift", "1989", "FEATURED",
    "Taylor Swift released '1989' as her fifth studio album (2014)",
    "Wikipedia",
  ),
  createEdge(
    "lorde", "melodrama", "FEATURED",
    "Lorde released 'Melodrama' as her second studio album (2017)",
    "Wikipedia",
  ),
  createEdge(
    "lorde", "pure_heroine", "FEATURED",
    "Lorde released 'Pure Heroine' as her debut studio album (2013)",
    "Wikipedia",
  ),

  // === Label 關係 ===
  createEdge(
    "newjeans", "ador", "SIGNED_TO",
    "NewJeans debuted under ADOR, a subsidiary of HYBE Corporation (2022)",
    "Press Release",
  ),
  createEdge(
    "charlie_puth", "republic_records", "SIGNED_TO",
    "Charlie Puth is signed to Atlantic Records via Artist Partner Group",
    "Wikipedia",
  ),
] as const;
