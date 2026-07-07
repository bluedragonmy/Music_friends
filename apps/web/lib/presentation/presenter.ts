// =============================================================================
// Presenter — 將排序路徑轉換為富含解釋性指標的 DTO
// =============================================================================

import { DiscoveryPath } from "../graph/query";
import { Entity } from "../graph/entity";
import { RankedRevelation } from "../graph/revelation";

import { ArchiveInfo, LinkStatus } from "../graph/edge";

export interface RevealEvidence {
  readonly entityId: string;
  readonly type: string;
  readonly relation: string;
  readonly factId: string;
  readonly evidences: readonly {
    readonly factId: string;
    readonly sources: readonly {
      readonly type: string;
      readonly title: string;
      readonly url?: string;
      readonly directness: string;
      readonly retrievedAt?: string;
      readonly archive?: ArchiveInfo;
      readonly status?: LinkStatus;
    }[];
  }[];
}

export interface RevealDTO {
  readonly id: string;
  readonly path: DiscoveryPath;
  readonly bridge: Entity;               // 起點與終點的關鍵連接中介實體
  readonly novelty: number;
  readonly rarity: number;
  readonly credibility: number;
  readonly score: number;
  readonly evidence: readonly RevealEvidence[];
}

export class Presenter {
  /**
   * 將 RankedRevelation 降維轉化為無文案偏見的純淨資料結構 RevealDTO {揭露數據傳輸對象}。
   */
  static present(ranked: readonly RankedRevelation[]): readonly RevealDTO[] {
    return ranked.map((r, idx) => {
      const steps = r.path.steps;

      // 提取核心 Connection Bridge {連接橋樑} (取路徑中介節點，若路徑長度大於 2，通常中間那個就是 Bridge)
      const bridgeNode = steps.length > 2 ? steps[Math.floor(steps.length / 2)].entity : steps[steps.length - 1].entity;

      // 提取事實證據 (Evidence) 陣列，這對 Explainability {可解釋性} 至關重要
      const evidence: RevealEvidence[] = [];
      steps.forEach((step) => {
        if (step.edge) {
          evidence.push({
            entityId: step.entity.id,
            type: step.entity.type,
            relation: step.edge.type,
            factId: step.edge.evidences[0]?.factId || "",
            evidences: step.edge.evidences,
          });
        }
      });

      return {
        id: `rev_dto_00${idx + 1}`,
        path: r.path,
        bridge: bridgeNode,
        novelty: r.factors.novelty,
        rarity: r.factors.rarity,
        credibility: r.factors.credibility,
        score: r.score,
        evidence,
      };
    });
  }
}
