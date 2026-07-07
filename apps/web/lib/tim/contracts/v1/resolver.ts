/**
 * TIM Contracts v1 — Resolver
 *
 * 定義跨平台實體解析器的合約。每個平台（Spotify, MusicBrainz, Discogs）
 * 各自實作一個 Resolver，最後由 CompositeResolver 組合使用。
 */

import type { UnifiedEntity } from "./entity";

// ─────────────────────────────────────────────
// Resolver Contract
// ─────────────────────────────────────────────

/** 單一平台的實體解析器 */
export interface PlatformResolver {
  readonly platform: string;

  /** 嘗試將平台特定的原始數據解析為 UnifiedEntity（部分欄位）。 */
  resolve(rawData: unknown): Promise<Partial<UnifiedEntity> | null>;
}

/** 組合解析器。整合多個 PlatformResolver 的結果，產出完整 UnifiedEntity。 */
export interface CompositeResolver {
  /** 給予原始數據，透過所有已註冊的 PlatformResolver 進行解析與合併 */
  resolve(rawData: unknown): Promise<UnifiedEntity>;
}
