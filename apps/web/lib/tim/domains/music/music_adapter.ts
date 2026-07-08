/**
 * TIM Music Domain Plugin — Music Domain Adapter
 * 
 * 音樂領域適配器。實作 DomainAdapter 介面，將科學核心引擎的實驗規劃需求
 * 轉化為對 MusicKnowledgeGraph 的路徑查詢與證據生成。
 */

import type { DomainAdapter } from "../../reasoning/core_engine";
import type { EvidenceRequirement, EvidenceChain } from "../../reasoning/scientific_dsl";
import { TIMGraphQueryAdapter } from "../../knowledge/query";
import { TIMEvidenceStoreAdapter } from "../../knowledge/evidence";
import { EntityType } from "../../contracts/v1/entity";
import { EdgeType, Evidence } from "../../contracts/v1/graph";

export class MusicDomainAdapter implements DomainAdapter {
  private readonly query: TIMGraphQueryAdapter;
  private readonly evidenceStore: TIMEvidenceStoreAdapter;

  constructor(query: TIMGraphQueryAdapter, evidenceStore: TIMEvidenceStoreAdapter) {
    this.query = query;
    this.evidenceStore = evidenceStore;
  }

  /**
   * 根據實驗規劃，在圖譜中檢索並建立證據鏈
   */
  async findEvidenceChains(
    targetEntityId: string,
    requirements: readonly EvidenceRequirement[],
    userHistoryEntities: readonly string[]
  ): Promise<readonly EvidenceChain[]> {
    const chains: EvidenceChain[] = [];

    // 針對音樂領域的特定證據需求，進行子圖路徑搜索
    for (const req of requirements) {
      if (req.type === "ProducerCredit") {
        // 搜尋：歷史歌曲 S -> PRODUCED_BY -> targetEntityId (製作人)
        for (const historyId of userHistoryEntities) {
          const node = this.query.findNode(historyId);
          if (node && node.type === EntityType.SONG) {
            // 尋找此歌曲的邊
            const edges = this.query.findEdges(historyId);
            const matchEdge = edges.find(e => 
              e.type === EdgeType.PRODUCED_BY && 
              (e.sourceId === targetEntityId || e.targetId === targetEntityId)
            );

            if (matchEdge) {
              // 載入該邊的證據
              const rawEvidences = this.query.findEvidence(matchEdge.id);
              for (const rev of rawEvidences) {
                this.evidenceStore.saveEvidence(rev);
              }

              const strength = this.evidenceStore.calculateStrength(matchEdge.id);

              chains.push({
                path: [historyId, targetEntityId],
                confidence: strength > 0 ? strength : matchEdge.confidence,
                sources: rawEvidences.map(e => ({
                  type: e.source,
                  title: e.title,
                  url: e.url
                }))
              });
            }
          }
        }
      } else if (req.type === "InfluencedBy") {
        // 搜尋：歷史藝人 A -> INFLUENCED_BY -> targetEntityId (影響源藝人)
        for (const historyId of userHistoryEntities) {
          const node = this.query.findNode(historyId);
          if (node && node.type === EntityType.ARTIST) {
            const edges = this.query.findEdges(historyId);
            const matchEdge = edges.find(e => 
              e.type === EdgeType.INFLUENCED_BY && 
              ((e.sourceId === historyId && e.targetId === targetEntityId) || 
               (e.sourceId === targetEntityId && e.targetId === historyId))
            );

            if (matchEdge) {
              const rawEvidences = this.query.findEvidence(matchEdge.id);
              for (const rev of rawEvidences) {
                this.evidenceStore.saveEvidence(rev);
              }

              const strength = this.evidenceStore.calculateStrength(matchEdge.id);

              chains.push({
                path: [historyId, targetEntityId],
                confidence: strength > 0 ? strength : matchEdge.confidence,
                sources: rawEvidences.map(e => ({
                  type: e.source,
                  title: e.title,
                  url: e.url
                }))
              });
            }
          }
        }
      }
    }

    return chains;
  }

  /**
   * 搜尋與用戶歷史實體鄰近的候選假說目標
   */
  async findCandidateTargets(
    userHistoryEntities: readonly string[],
    targetType: string
  ): Promise<readonly string[]> {
    const candidates = new Set<string>();

    for (const historyId of userHistoryEntities) {
      const neighbors = this.query.findNeighbors(historyId);
      for (const n of neighbors) {
        if (n.type.toString() === targetType) {
          candidates.add(n.id);
        }
      }
    }

    return Array.from(candidates);
  }
}
