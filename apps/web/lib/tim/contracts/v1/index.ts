/**
 * TIM Contracts v1 — Barrel Export
 *
 * 所有 v1 合約的統一匯出入口。
 * 上層模組只需 import from "@/lib/tim/contracts/v1"。
 */

// Entity
export {
  EntityType,
  type IdentifierMap,
  type Provenance,
  type UnifiedEntity,
} from "./entity";

// Graph
export {
  EdgeType,
  type TemporalValidity,
  type GraphEdge,
  FactSource,
  SOURCE_RELIABILITY,
  Directness,
  type Evidence,
} from "./graph";

// Query
export { type ReadGraphQuery } from "./query";

// Resolver
export { type PlatformResolver, type CompositeResolver } from "./resolver";

// Cache
export {
  type CachePolicy,
  type SubgraphCache,
  type CacheStats,
} from "./cache";

// Pipeline
export {
  type PipelineStage,
  type BuildMetrics,
  HealthStatus,
  type GraphHealthReport,
} from "./pipeline";

// Evidence Store
export { type EvidenceStore } from "./evidence";

// Reasoning (Sprint 2 placeholder)
export {
  type InferenceRule,
  type RuleCondition,
  type RuleOutput,
  type ReasoningTrace,
} from "./reasoning";
