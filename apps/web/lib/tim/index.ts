/**
 * TIM — Taste Intelligence Model & Scientific Reasoning Engine
 *
 * 系統層級 barrel export。
 * 所有外部模組透過 "@/lib/tim" 存取通用推理核心與音樂領域適配。
 */

export * from "./contracts/v1";
export { TIM_CONFIG } from "./config";

// 通用推理核心
export * from "./reasoning/scientific_dsl";
export * from "./reasoning/planner";
export * from "./reasoning/core_engine";

// 知識適配層
export * from "./knowledge/query";
export * from "./knowledge/evidence";

// 敘事與領域 Plugin
export * from "./narrator/narrative";
export * from "./domains/music/music_adapter";
