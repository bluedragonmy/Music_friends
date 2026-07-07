/**
 * TIM Configuration — No Hidden Magic Numbers
 *
 * 所有系統數值參數集中管理於此。
 * Engineering Rule 6: 禁止在業務邏輯中硬編碼任何閾值或權重。
 */

export const TIM_CONFIG = {
  // ── Bayesian ──
  /** 品味衰減常數 λ（90 天半衰期） */
  DECAY_CONSTANT_LAMBDA: 0.0077,

  // ── Evidence ──
  /** 最低證據強度門檻（低於此值的假說將被過濾） */
  MIN_EVIDENCE_STRENGTH_THRESHOLD: 0.5,

  // ── Ranking ──
  /** 驚奇度權重係數 */
  SURPRISE_WEIGHT: 1.2,
  /** 複雜度懲罰係數 */
  COMPLEXITY_PENALTY_COEFFICIENT: 0.15,

  // ── Cache Policies ──
  CACHE_POLICIES: {
    PRODUCER: { name: "ProducerCache", ttlMs: 7 * 24 * 60 * 60 * 1000, maxEntries: 500 },
    STUDIO: { name: "StudioCache", ttlMs: 7 * 24 * 60 * 60 * 1000, maxEntries: 200 },
    ARTIST: { name: "ArtistCache", ttlMs: 24 * 60 * 60 * 1000, maxEntries: 1000 },
    TRACK: { name: "TrackCache", ttlMs: 6 * 60 * 60 * 1000, maxEntries: 5000 },
  },

  // ── Doctor Thresholds ──
  /** 孤立節點超過此數量觸發 WARNING */
  DOCTOR_DISCONNECTED_WARN: 5,
  /** 衝突邊超過此數量觸發 CRITICAL */
  DOCTOR_CONFLICT_CRITICAL: 3,
} as const;
