/**
 * TIM Contracts v1 — Cache & CachePolicy
 *
 * 定義子圖快取的合約。不寫死 TTL，透過 CachePolicy 讓不同資料類型
 * 擁有各自的存活時間與失效策略。
 */

// ─────────────────────────────────────────────
// Cache Policy
// ─────────────────────────────────────────────

/** 快取策略合約。每種資料類型可定義不同的 TTL 與淘汰機制。 */
export interface CachePolicy {
  readonly name: string;
  /** 存活時間，單位為毫秒 */
  readonly ttlMs: number;
  /** 最大快取條目數 */
  readonly maxEntries: number;
}

// ─────────────────────────────────────────────
// Subgraph Cache
// ─────────────────────────────────────────────

/** 子圖快取合約。Knowledge Layer 與 Reasoning 層之間的效能緩衝。 */
export interface SubgraphCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  has(key: string): boolean;
  invalidate(key: string): void;
  invalidateAll(): void;
  readonly stats: CacheStats;
}

export interface CacheStats {
  readonly hits: number;
  readonly misses: number;
  readonly entries: number;
  readonly hitRate: number;
}
