/**
 * TIM Knowledge Layer — Evidence Store Adapter
 * 
 * 實作 EvidenceStore 介面。將證據與關係邊解耦儲存，並評估多個證據來源之綜合可信度強度。
 */

import { EvidenceStore } from "../contracts/v1/evidence";
import { Evidence, FactSource } from "../contracts/v1/graph";

export class TIMEvidenceStoreAdapter implements EvidenceStore {
  private readonly store = new Map<string, Evidence[]>();

  saveEvidence(evidence: Evidence): void {
    const list = this.store.get(evidence.edgeId) ?? [];
    list.push(evidence);
    this.store.set(evidence.edgeId, list);
  }

  getEvidenceForEdge(edgeId: string): readonly Evidence[] {
    return this.store.get(edgeId) ?? [];
  }

  /**
   * 計算特定關係邊的綜合證據強度
   * 評估標準：
   * - 官方學術/製作 Credits: 0.95
   * - 官方網站 (Official Website): 0.85
   * - MusicBrainz / Discogs: 0.80
   * - Wikipedia: 0.70
   * - 新聞媒體 (News): 0.60
   * - 社群網站: 0.40
   */
  calculateStrength(edgeId: string): number {
    const evidences = this.getEvidenceForEdge(edgeId);
    if (evidences.length === 0) return 0.0;

    let maxStrength = 0.0;

    for (const ev of evidences) {
      let strength = 0.3; // 預設

      switch (ev.source) {
        case FactSource.OFFICIAL_CREDITS:
          strength = 0.95;
          break;
        case FactSource.OFFICIAL_WEBSITE:
          strength = 0.85;
          break;
        case FactSource.DISCOGS:
          strength = 0.80;
          break;
        case FactSource.WIKIPEDIA:
          strength = 0.70;
          break;
        case FactSource.NEWS:
          strength = 0.60;
          break;
        case FactSource.COMMUNITY_WIKI:
          strength = 0.50;
          break;
      }

      if (ev.directness === "SECONDARY") {
        strength *= 0.8; // 間接證據衰減
      }

      if (strength > maxStrength) {
        maxStrength = strength;
      }
    }

    return maxStrength;
  }
}
