export type ObservationCategory = "pattern" | "change" | "milestone" | "memory";

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
}

export interface CandidateJournal {
  observationId: string;
  category: ObservationCategory;
  variables: Record<string, any>;
  confidence: number;
  rarityScore: number; // 根據 rarity 轉換出的數值，便於排序
}
