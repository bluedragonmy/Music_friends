// =============================================================================
// MusicKnowledgeGraph — 圖譜的核心資料結構與操作
// =============================================================================

import { Entity, SEED_ENTITIES } from "./entity";
import { Edge, SEED_EDGES } from "./edge";

/**
 * Music Knowledge Graph（音樂知識圖譜）。
 *
 * 這是整個產品的基礎設施層。未來的 Discovery、Recommendation、
 * Friend Match、Search、Producer Explorer 都將共用這個 Graph。
 *
 * 內部使用 adjacency list（鄰接表）來加速 neighbors() 查詢。
 * 所有邊都是雙向索引的 — 無論你從 source 還是 target 出發，
 * 都能找到對應的鄰居。
 */
export class MusicKnowledgeGraph {
  private readonly entities: Map<string, Entity> = new Map();
  private readonly edgeList: Edge[] = [];
  private readonly adjacency: Map<string, Edge[]> = new Map();

  /** 新增一個實體到圖譜中。如果 ID 已存在則覆蓋。 */
  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
  }

  /**
   * 新增一條邊到圖譜中。
   *
   * 邊會被雙向索引：source → edge 和 target → edge，
   * 這樣從任一端都能透過 neighbors() 找到對方。
   */
  addEdge(edge: Edge): void {
    this.edgeList.push(edge);

    // 為 source 建立索引
    const sourceEdges = this.adjacency.get(edge.source) ?? [];
    sourceEdges.push(edge);
    this.adjacency.set(edge.source, sourceEdges);

    // 為 target 建立索引（雙向）
    const targetEdges = this.adjacency.get(edge.target) ?? [];
    targetEdges.push(edge);
    this.adjacency.set(edge.target, targetEdges);
  }

  /** 以 ID 查找實體。 */
  findEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  /**
   * 以名稱查找實體（大小寫不敏感）。
   *
   * 用於使用者輸入名稱時的模糊匹配。
   * 如果有多個匹配，回傳第一個找到的。
   */
  findEntityByName(name: string): Entity | undefined {
    const lower = name.toLowerCase();
    for (const entity of this.entities.values()) {
      if (entity.name.toLowerCase() === lower) {
        return entity;
      }
    }
    return undefined;
  }

  /**
   * 取得某實體的所有鄰居。
   *
   * 回傳該實體透過任何邊連接到的所有其他實體，
   * 以及它們之間的關係（edge）。
   */
  neighbors(entityId: string): Array<{ entity: Entity; edge: Edge }> {
    const edges = this.adjacency.get(entityId) ?? [];
    const results: Array<{ entity: Entity; edge: Edge }> = [];

    for (const edge of edges) {
      // 找到邊的另一端
      const neighborId = edge.source === entityId ? edge.target : edge.source;
      const entity = this.entities.get(neighborId);

      if (entity) {
        results.push({ entity, edge });
      }
    }

    return results;
  }

  /** 取得圖譜中的所有實體。 */
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  /** 取得圖譜中的所有邊。 */
  getAllEdges(): readonly Edge[] {
    return this.edgeList;
  }

  /** 取得圖譜的統計資訊。 */
  getStats(): { entityCount: number; edgeCount: number } {
    return {
      entityCount: this.entities.size,
      edgeCount: this.edgeList.length,
    };
  }
}

// =============================================================================
// Factory — 建立已載入種子資料的圖譜
// =============================================================================

/**
 * 建立一個已載入所有 Seed Data（種子資料）的圖譜。
 *
 * 這是取得可用圖譜的最簡單方式。
 * 所有硬編碼的事實資料都會被自動載入。
 */
export function createSeededGraph(): MusicKnowledgeGraph {
  const graph = new MusicKnowledgeGraph();

  for (const entity of SEED_ENTITIES) {
    graph.addEntity(entity);
  }

  for (const edge of SEED_EDGES) {
    graph.addEdge(edge);
  }

  return graph;
}
