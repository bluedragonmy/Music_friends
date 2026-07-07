/**
 * TIM Contracts v1 — Graph Edge & Evidence
 *
 * 定義 Knowledge Graph 中關係邊（Edge）與證據（Evidence）的合約。
 * Evidence 與 Edge 解耦：同一條 Edge 可被多條獨立 Evidence 支持。
 */

import type { EntityType } from "./entity";

// ─────────────────────────────────────────────
// Edge Types
// ─────────────────────────────────────────────

export const enum EdgeType {
  PRODUCED_BY = "PRODUCED_BY",
  ENGINEERED_BY = "ENGINEERED_BY",
  RECORDED_AT = "RECORDED_AT",
  RELEASED_ON = "RELEASED_ON",
  MEMBER_OF = "MEMBER_OF",
  INFLUENCED_BY = "INFLUENCED_BY",
  SAMPLED = "SAMPLED",
  BELONGS_TO = "BELONGS_TO",
  COLLABORATED_WITH = "COLLABORATED_WITH",
  MASTERED_BY = "MASTERED_BY",
}

// ─────────────────────────────────────────────
// Temporal Validity
// ─────────────────────────────────────────────

/** 時序有效性。表示某關係在特定時間區間內成立。 */
export interface TemporalValidity {
  readonly validFrom?: string;
  readonly validTo?: string;
}

// ─────────────────────────────────────────────
// Graph Edge
// ─────────────────────────────────────────────

/** Knowledge Graph 中的關係邊。具備固有信賴度與時序有效性。 */
export interface GraphEdge {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly type: EdgeType;
  readonly confidence: number;
  readonly temporal?: TemporalValidity;
}

// ─────────────────────────────────────────────
// Fact Source Reliability
// ─────────────────────────────────────────────

export const enum FactSource {
  OFFICIAL_CREDITS = "OFFICIAL_CREDITS",
  OFFICIAL_WEBSITE = "OFFICIAL_WEBSITE",
  MUSICBRAINZ = "MUSICBRAINZ",
  DISCOGS = "DISCOGS",
  INTERVIEW = "INTERVIEW",
  NEWS = "NEWS",
  WIKIPEDIA = "WIKIPEDIA",
  COMMUNITY_WIKI = "COMMUNITY_WIKI",
}

/** 來源可靠度權重查閱表。高權重代表高可靠度。 */
export const SOURCE_RELIABILITY: Readonly<Record<FactSource, number>> = {
  [FactSource.OFFICIAL_CREDITS]: 1.0,
  [FactSource.OFFICIAL_WEBSITE]: 0.98,
  [FactSource.MUSICBRAINZ]: 0.95,
  [FactSource.DISCOGS]: 0.9,
  [FactSource.INTERVIEW]: 0.8,
  [FactSource.NEWS]: 0.75,
  [FactSource.WIKIPEDIA]: 0.6,
  [FactSource.COMMUNITY_WIKI]: 0.35,
};

// ─────────────────────────────────────────────
// Evidence
// ─────────────────────────────────────────────

export const enum Directness {
  PRIMARY = "PRIMARY",
  SECONDARY = "SECONDARY",
}

/** 證據節點。與 Edge 解耦，透過 edgeId 關聯。 */
export interface Evidence {
  readonly id: string;
  readonly edgeId: string;
  readonly source: FactSource;
  readonly directness: Directness;
  readonly title: string;
  readonly url?: string;
  readonly archive?: {
    readonly provider: string;
    readonly url: string;
    readonly capturedAt: string;
  };
}
