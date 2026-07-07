// =============================================================================
// Revelation Engine — 世界模型遍歷與好奇心評估演算法
// =============================================================================

import { Entity, SEED_ENTITIES } from "./entity";
import { MusicKnowledgeGraph } from "./graph";
import { PathStep, DiscoveryPath } from "./query";
import { UserProjection } from "./user_projection";
import { DefaultCandidateGenerator } from "./candidate";

// =============================================================================
// Types
// =============================================================================

export interface RankedRevelation {
  readonly path: DiscoveryPath;
  readonly score: number;
  readonly factors: {
    readonly novelty: number;     // 新穎度
    readonly rarity: number;      // 稀有度
    readonly credibility: number; // 可信度
  };
}

// =============================================================================
// Pipeline Layer 1: extractKnownEntities (使用 CandidateGenerator 過濾生成)
// =============================================================================

export function extractKnownEntities(
  userProjection: UserProjection,
  worldGraph: MusicKnowledgeGraph
): Entity[] {
  // 引進 CandidateGenerator 介面縮小尋訪範圍，此處先以預設產生器執行
  const generator = new DefaultCandidateGenerator();
  return generator.generate(userProjection, worldGraph) as Entity[];
}

// =============================================================================
// Pipeline Layer 2: discoverCandidates (尋訪世界模型 Known → Unknown)
// =============================================================================

export function discoverCandidates(
  worldGraph: MusicKnowledgeGraph,
  knownEntities: Entity[],
  maxDepth: number = 3
): DiscoveryPath[] {
  const candidates: DiscoveryPath[] = [];

  // 對已知集合中的所有藝人，尋找他們與圖中其它任何實體的連接路徑
  for (let i = 0; i < knownEntities.length; i++) {
    const source = knownEntities[i];

    // 取得世界模型中其餘的實體作為 Target
    const targetEntities = SEED_ENTITIES.filter(e => e.id !== source.id);

    for (const target of targetEntities) {
      const paths = findPathsBetween(worldGraph, source, target, maxDepth);
      candidates.push(...paths);
    }
  }

  // 去除重複路徑（依據節點 ID 的拼接識別，反向也防重）
  const uniquePaths: DiscoveryPath[] = [];
  const seenPathKeys = new Set<string>();

  for (const p of candidates) {
    const key = p.steps.map((s) => s.entity.id).join("->");
    const revKey = [...p.steps].reverse().map((s) => s.entity.id).join("->");

    if (!seenPathKeys.has(key) && !seenPathKeys.has(revKey)) {
      seenPathKeys.add(key);
      uniquePaths.push(p);
    }
  }

  return uniquePaths;
}

/** BFS/DFS 輔助：尋找兩實體間所有路徑 */
function findPathsBetween(
  graph: MusicKnowledgeGraph,
  source: Entity,
  target: Entity,
  maxDepth: number
): DiscoveryPath[] {
  const foundPaths: DiscoveryPath[] = [];

  function dfs(
    currentId: string,
    targetId: string,
    currentPath: PathStep[],
    visited: Set<string>
  ) {
    if (currentPath.length - 1 > maxDepth) {
      return;
    }

    if (currentId === targetId) {
      // 確保路徑中至少包含一條非 trivial (隱秘/驚喜) 的事實邊
      const hasNonTrivialEdge = currentPath.some(
        (step) => step.edge !== null && step.edge.isTrivial !== true
      );
      
      if (hasNonTrivialEdge) {
        foundPaths.push({
          steps: [...currentPath],
          length: currentPath.length - 1,
        });
      }
      return;
    }

    const neighbors = graph.neighbors(currentId);
    for (const { entity: neighbor, edge } of neighbors) {
      // === 語意路徑約束 (Semantic Path Constraints) ===
      
      // 1. 禁止以唱片公司 (label) 做為中介轉折點
      if (neighbor.type === "label") {
        continue;
      }

      // 2. 限制路徑中歌曲 (song) 的數量最多為 1，防止多首歌機械式接龍
      const songCount = currentPath.filter(step => step.entity.type === "song").length;
      if (neighbor.type === "song" && songCount >= 1) {
        continue;
      }

      // 3. 避免 A ↔ B ↔ A 的自循環，或是同藝人內部歌曲的來回
      const visitedIds = currentPath.map(step => step.entity.id);
      
      // 如果上一點是自己，或者路徑中已經包含該實體，防重
      if (visitedIds.includes(neighbor.id)) {
        continue;
      }

      // 4. 禁止連續兩步都是常識邊 (isTrivial: true)
      if (edge && edge.isTrivial === true) {
        const lastStep = currentPath[currentPath.length - 1];
        if (lastStep && lastStep.edge && lastStep.edge.isTrivial === true) {
          continue; // 連續兩步常識邊，剪枝
        }
      }

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

  return foundPaths;
}

// =============================================================================
// Pipeline Layer 3: evaluateCuriosity (Curiosity Evaluator 好奇心評估器)
// =============================================================================

export function evaluateCuriosity(
  paths: DiscoveryPath[],
  userProjection: UserProjection
): RankedRevelation[] {
  const knownIds = new Set(Object.keys(userProjection.entities));

  return paths.map((path) => {
    // 1. Novelty {新穎度}：路徑中包含多少比例使用者「未聽過」的 Unknown 實體
    const totalEntities = path.steps.length;
    const unknownEntities = path.steps.filter((s) => !knownIds.has(s.entity.id)).length;
    const novelty = totalEntities > 0 ? unknownEntities / totalEntities : 0;

    // 2. Rarity {稀有度}：經過特定角色（如製作人、事件）加分，大眾唱片公司扣分
    let rarity = 0.5;
    const hasProducer = path.steps.some(s => s.entity.type === "producer");
    const hasEvent = path.steps.some(s => s.entity.type === "event");
    const hasLabel = path.steps.some(s => s.entity.type === "label");
    
    if (hasProducer) rarity += 0.2;
    if (hasEvent) rarity += 0.2;
    if (hasLabel) rarity -= 0.3;

    let credibility = 0.5;
    const sourceTypes: string[] = [];
    path.steps.forEach(s => {
      if (s.edge?.evidences) {
        s.edge.evidences.forEach(ev => {
          ev.sources.forEach(src => {
            sourceTypes.push(src.type);
          });
        });
      }
    });
    if (sourceTypes.includes("Credits")) credibility += 0.2;
    if (sourceTypes.includes("Wikipedia")) credibility += 0.1;
    if (sourceTypes.includes("Instagram")) credibility += 0.2;

    // 4. 閉環加權 (Cycle / Known-Unknown-Known Connection)
    // 如果起點與終點皆在 user 已知圖譜中，代表這是一條成功閉合使用者兩個愛好的黃金環狀路徑！
    const sourceId = path.steps[0].entity.id;
    const targetId = path.steps[path.steps.length - 1].entity.id;
    const isCycleConnection = knownIds.has(sourceId) && knownIds.has(targetId);

    // 綜合計算分數 (0.0 ~ 1.0)
    let score = (novelty * 0.4) + (rarity * 0.3) + (credibility * 0.3);
    if (isCycleConnection) {
      score += 0.4; // 閉環黃金加成！
    }
    score = Math.min(1.0, Math.max(0.0, score));

    return {
      path,
      score: parseFloat(score.toFixed(2)),
      factors: {
        novelty: parseFloat(novelty.toFixed(2)),
        rarity: parseFloat(rarity.toFixed(2)),
        credibility: parseFloat(credibility.toFixed(2)),
      }
    };
  }).sort((a, b) => b.score - a.score); // 高分在前
}
