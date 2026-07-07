export type ObservationCategory = "pattern" | "moment" | "change" | "remembering" | "echo";


export type RarityLevel = "common" | "uncommon" | "rare" | "legendary";

export interface MicrocopyTemplate {
  loop_step_1: string;
  loop_step_2: string;
  loop_step_3: string;
}

export interface ObservationRule {
  id: string;
  category: ObservationCategory;
  title: string;
  trigger: Record<string, any>; // 用於描述或程式執行的觸發設定
  priority: "low" | "medium" | "high";
  rarity: RarityLevel;
  cooldown: number; // 冷卻天數 (例如 30)
  emotion: string;
  tone: string;
  microcopy: MicrocopyTemplate;
  reflection: string;
  version?: string; // 新增：Rule Version
  evidenceTemplate?: string; // 新增：Evidence Template
}

export interface CandidateJournal {
  observationId: string;
  category: ObservationCategory;
  variables: Record<string, any>;
  confidence: number;
  rarityScore: number; // 根據 rarity 轉換出的數值，便於排序
}

// ── Behavior Baseline Abstraction ──────────────────────────────
// Narrative Engine 不知道資料從哪裡來。
// 第一版：SyncLog Rolling Window。
// 未來：Redis / Cache / Materialized View — 只換 Provider，不動 Engine。

export interface BehaviorBaseline {
  mean: { novelty: number; repeatRate: number; genreDiversity: number };
  std: { novelty: number; repeatRate: number; genreDiversity: number };
  sampleCount: number; // 窗口數量。< 3 時 Unexpectedness 回退為 1.0
}

export interface BehaviorBaselineProvider {
  getBaseline(userId: string, referenceDate?: Date): Promise<BehaviorBaseline>;
}
