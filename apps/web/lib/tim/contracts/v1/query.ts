/**
 * TIM Contracts v1 — Read-only Graph Query API
 *
 * Reasoning 層與 Decision 層永遠只能透過此合約查詢 Knowledge Graph。
 * 嚴格禁止直接存取 Graph 本體（nodes/edges 陣列）。
 */

import type { EntityType, UnifiedEntity } from "./entity";
import type { GraphEdge, Evidence } from "./graph";

// ─────────────────────────────────────────────
// Read-only Query Contract
// ─────────────────────────────────────────────

/** 唯讀圖譜查詢介面。Reasoning 層的唯一資料存取路徑。 */
export interface ReadGraphQuery {
  /** 透過 ID 查詢單一實體 */
  findNode(id: string): UnifiedEntity | undefined;

  /** 查詢指定實體的所有直接鄰居 */
  findNeighbors(id: string): readonly UnifiedEntity[];

  /** 查詢兩個實體之間的最短路徑（回傳經過的 Edge 序列） */
  findShortestPath(
    sourceId: string,
    targetId: string
  ): readonly GraphEdge[];

  /** 查詢從指定實體出發的所有 Edge */
  findEdges(entityId: string): readonly GraphEdge[];

  /** 依 EntityType 篩選所有實體 */
  findByType(type: EntityType): readonly UnifiedEntity[];

  /** 透過跨平台識別符查詢實體 */
  findByIdentifier(
    platform: string,
    platformId: string
  ): UnifiedEntity | undefined;

  /** 查詢指定 Edge 的所有關聯 Evidence */
  findEvidence(edgeId: string): readonly Evidence[];
}
