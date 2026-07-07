/**
 * TIM Contracts v1 — Pipeline Stage
 *
 * 定義 Builder Pipeline 的泛型 Stage 合約。每個 Stage 可獨立測試、
 * 獨立替換（例如：從 Spotify 改為 Apple Music 只需替換 NormalizeStage）。
 */

// ─────────────────────────────────────────────
// Pipeline Stage Contract
// ─────────────────────────────────────────────

/** 管線階段合約。每個 Builder Stage 實作此泛型介面。 */
export interface PipelineStage<TIn, TOut> {
  readonly name: string;
  execute(input: TIn): Promise<TOut>;
}

// ─────────────────────────────────────────────
// Build Metrics
// ─────────────────────────────────────────────

/** Builder 完成後的構建指標輸出。 */
export interface BuildMetrics {
  readonly entityCount: number;
  readonly edgeCount: number;
  readonly resolvedPercentage: number;
  readonly conflictCount: number;
  readonly missingIdentifierCount: number;
  readonly durationMs: number;
}

// ─────────────────────────────────────────────
// Graph Health Report (for tim doctor)
// ─────────────────────────────────────────────

export const enum HealthStatus {
  HEALTHY = 0,
  WARNING = 1,
  CRITICAL = 2,
}

export interface GraphHealthReport {
  readonly status: HealthStatus;
  readonly entityCount: number;
  readonly edgeCount: number;
  readonly disconnectedNodes: readonly string[];
  readonly missingProvenance: readonly string[];
  readonly conflictedEdges: readonly string[];
  readonly averageDegree: number;
}
