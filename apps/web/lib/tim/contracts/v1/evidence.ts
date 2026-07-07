/**
 * TIM Contracts v1 — Evidence Store
 *
 * 定義獨立證據儲存庫的合約。Evidence 與 Edge 解耦存放，
 * 允許同一條 Edge 對應多條來自不同來源的 Evidence。
 */

import type { Evidence } from "./graph";

// ─────────────────────────────────────────────
// Evidence Store Contract
// ─────────────────────────────────────────────

/** 證據儲存庫合約。提供證據的新增、查詢與強度計算。 */
export interface EvidenceStore {
  /** 取得指定 Edge 的所有 Evidence */
  getByEdgeId(edgeId: string): readonly Evidence[];

  /** 取得指定 Evidence ID 的完整 Evidence */
  getById(id: string): Evidence | undefined;

  /** 計算指定 Edge 的綜合證據強度 (ES) */
  computeStrength(edgeId: string): number;

  /** 儲存庫中的 Evidence 總數 */
  readonly count: number;
}
