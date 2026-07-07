/**
 * TIM Contracts v1 — Reasoning (placeholder)
 *
 * Sprint 2 預留的推理引擎合約。
 * Sprint 1 中不實作，但在此定義介面邊界，確保 Knowledge Layer 的設計
 * 在未來能無縫銜接 Reasoning Layer。
 */

import type { UnifiedEntity } from "./entity";
import type { GraphEdge, Evidence } from "./graph";

// ─────────────────────────────────────────────
// Reasoning Contracts (Sprint 2 placeholder)
// ─────────────────────────────────────────────

export interface InferenceRule {
  readonly id: string;
  readonly description: string;
  readonly priority: number;
  readonly conditions: readonly RuleCondition[];
  readonly output: RuleOutput;
}

export interface RuleCondition {
  readonly pattern: string;
}

export interface RuleOutput {
  readonly relation: string;
  readonly confidenceMultiplier: number;
}

export interface ReasoningTrace {
  readonly ruleId: string;
  readonly matchedPath: readonly string[];
  readonly timestamp: string;
}
