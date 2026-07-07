// =============================================================================
// Graph Module — 統一匯出
// =============================================================================

export { createEntity, SEED_ENTITIES } from "./entity";
export type { Entity, EntityType, EntityConfidence } from "./entity";

export { createEdge, SEED_EDGES } from "./edge";
export type { Edge, EdgeType, FactSource } from "./edge";

export { MusicKnowledgeGraph, createSeededGraph } from "./graph";

export { discoverBridge } from "./query";
export type { PathStep, DiscoveryPath, DiscoveryResult } from "./query";
