// =============================================================================
// Query — Music Knowledge Graph 的遍歷查詢引擎
// =============================================================================

import { Entity } from "./entity";
import { Edge } from "./edge";
import { MusicKnowledgeGraph } from "./graph";

// =============================================================================
// Types
// =============================================================================

/** 一個完整的關係路徑步驟 */
export interface PathStep {
  readonly entity: Entity;
  readonly edge: Edge | null; // 第一個起點節點沒有 edge
}

/** 一條發現的關聯路徑 */
export interface DiscoveryPath {
  readonly steps: readonly PathStep[];
  readonly length: number; // 步數 (Edge 數量)
}

/** 
 * 發現結果
 * 
 * 包含了兩個實體之間所有找到的關聯路徑。
 */
export interface DiscoveryResult {
  readonly source: Entity;
  readonly target: Entity;
  readonly paths: readonly DiscoveryPath[];
}

// =============================================================================
// Core Traversal Engine {遍歷引擎}
// =============================================================================

/**
 * 發現兩個實體之間所有意想不到的關聯路徑 (Paths)。
 *
 * 忠於事實。不為演算法扭曲圖譜。
 * Traversal Engine 透過深度搜尋，能找出長度在指定範圍（預設 3 步內）內的所有真實路徑。
 * 
 * 例如：
 * Charlie Puth (Artist)
 *   ↓ [APPEARED_AT] (Podcast Interview)
 * Charlie Puth sends demos to 250 (Event)
 *   ↑ [MENTIONED_IN] (Podcast Interview)
 * 250 (Producer)
 *   ↑ [COLLABORATED_WITH] (Credits)
 * NewJeans (Artist)
 * 
 * 這是一條 3 步關聯路徑，完全符合「意想不到的驚喜發現」。
 */
export function discoverBridge(
  graph: MusicKnowledgeGraph,
  entityNames: string[],
  maxDepth: number = 3,
): DiscoveryResult[] {
  // 1. 解析輸入名稱為 Entity
  const inputEntities: Entity[] = [];
  for (const name of entityNames) {
    const entity = graph.findEntityByName(name);
    if (entity) {
      inputEntities.push(entity);
    }
  }

  // 至少需要兩個實體來找關聯
  if (inputEntities.length < 2) {
    return [];
  }

  const results: DiscoveryResult[] = [];

  // 配對所有輸入的實體 (例如 A 與 B, B 與 C...)
  for (let i = 0; i < inputEntities.length; i++) {
    for (let j = i + 1; j < inputEntities.length; j++) {
      const source = inputEntities[i];
      const target = inputEntities[j];

      // 尋找 source 與 target 之間的所有路徑
      const paths = findAllPaths(graph, source, target, maxDepth);
      if (paths.length > 0) {
        results.push({ source, target, paths });
      }
    }
  }

  return results;
}

/**
 * 使用 BFS / DFS 尋找圖中兩點之間長度小於等於 maxDepth 的所有簡單路徑。
 */
function findAllPaths(
  graph: MusicKnowledgeGraph,
  source: Entity,
  target: Entity,
  maxDepth: number,
): DiscoveryPath[] {
  const foundPaths: DiscoveryPath[] = [];

  // DFS 輔助函式
  function dfs(
    currentId: string,
    targetId: string,
    currentPath: PathStep[],
    visited: Set<string>,
  ) {
    if (currentPath.length - 1 > maxDepth) {
      return;
    }

    if (currentId === targetId) {
      // 找到了！複製目前路徑並儲存
      foundPaths.push({
        steps: [...currentPath],
        length: currentPath.length - 1,
      });
      return;
    }

    const neighbors = graph.neighbors(currentId);
    for (const { entity: neighbor, edge } of neighbors) {
      if (!visited.has(neighbor.id)) {
        visited.add(neighbor.id);
        currentPath.push({ entity: neighbor, edge });

        dfs(neighbor.id, targetId, currentPath, visited);

        currentPath.pop();
        visited.delete(neighbor.id);
      }
    }
  }

  const startStep: PathStep = { entity: source, edge: null };
  const visited = new Set<string>([source.id]);
  dfs(source.id, target.id, [startStep], visited);

  // 照路徑長度排序（最短的在前面）
  return foundPaths.sort((a, b) => a.length - b.length);
}
