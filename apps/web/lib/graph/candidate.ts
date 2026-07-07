// =============================================================================
// CandidateGenerator — 限制與縮小 Traversal 尋訪節點範圍的生成器介面
// =============================================================================

import { MusicKnowledgeGraph } from "./graph";
import { UserProjection } from "./user_projection";
import { Entity } from "./entity";

export interface CandidateGenerator {
  /**
   * 根據使用者的投影與世界模型，生成小規模的候選節點集 (Candidate Set)，避免圖遍歷時爆發節點爆炸。
   */
  generate(
    projection: UserProjection,
    graph: MusicKnowledgeGraph
  ): readonly Entity[];
}

export class DefaultCandidateGenerator implements CandidateGenerator {
  /**
   * 預設簡約實作：直接以 Projection 中的已知實體做為 Candidate，未來會在這裡實作基於 Producer/Genre 等中介縮減的過濾演算法。
   */
  generate(
    projection: UserProjection,
    graph: MusicKnowledgeGraph
  ): readonly Entity[] {
    const knownIds = Object.keys(projection.entities);
    const candidates: Entity[] = [];

    for (const id of knownIds) {
      const entity = graph.findEntity(id);
      if (entity) {
        candidates.push(entity);
      }
    }

    return candidates;
  }
}
