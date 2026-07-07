/**
 * TIM Contracts v1 — Entity Types & Core Abstractions
 *
 * 定義 TIM Knowledge Layer 的基礎實體型別與列舉。
 * 所有上層模組（Reasoning、Ranking、Narrator）僅透過此合約認識實體。
 */

// ─────────────────────────────────────────────
// Entity Type Enum
// ─────────────────────────────────────────────

export const enum EntityType {
  SONG = "SONG",
  ARTIST = "ARTIST",
  ALBUM = "ALBUM",
  PRODUCER = "PRODUCER",
  ENGINEER = "ENGINEER",
  LABEL = "LABEL",
  STUDIO = "STUDIO",
  GENRE = "GENRE",
}

// ─────────────────────────────────────────────
// Identifier Mapping
// ─────────────────────────────────────────────

/** 跨平台識別符映射。每個實體可同時擁有多個平台 ID。 */
export interface IdentifierMap {
  readonly spotifyUri?: string;
  readonly mbid?: string;
  readonly discogsId?: string;
  readonly isrc?: string;
  readonly upc?: string;
}

// ─────────────────────────────────────────────
// Provenance
// ─────────────────────────────────────────────

/** 數據來源溯源。記錄此實體來自哪個平台、何時擷取。 */
export interface Provenance {
  readonly source: string;
  readonly retrievedAt: string;
  readonly url?: string;
}

// ─────────────────────────────────────────────
// Unified Entity
// ─────────────────────────────────────────────

/** 所有實體的基礎合約。Knowledge Layer 中的每個 Node 都實作此介面。 */
export interface UnifiedEntity {
  readonly id: string;
  readonly type: EntityType;
  readonly name: string;
  readonly identifiers: IdentifierMap;
  readonly provenance: readonly Provenance[];
  readonly metadata: Readonly<Record<string, unknown>>;
}
