/**
 * TIM Core — Narrative Generator
 * 
 * 敘事生成器。與信念狀態 (Belief State) 動態連動，使敘事反映當前假說的實證信心度與不確定性。
 */

import type { EvaluatedHypothesis } from "../reasoning/scientific_dsl";

export class NarrativeGenerator {
  /**
   * 根據評估假說的最新 Belief State，動態生成科學報告文本
   */
  generate(evaluated: EvaluatedHypothesis): string {
    const { hypothesis, status, belief } = evaluated;
    const count = belief.evidenceCount;
    const uncertaintyPct = Math.round(belief.uncertainty * 100);
    const confidencePct = Math.round(belief.posterior * 100);

    if (status === "REJECTED") {
      return `【已駁回假說】關於您喜好「${hypothesis.targetConcept}」的推論目前已被駁回。原因：${evaluated.failureReason || "證據不足"}（後驗概率：${confidencePct}%，不確定性：${uncertaintyPct}%，僅有 ${count} 項證據）。`;
    }

    if (status === "ARCHIVED") {
      return `【封存假說】關於「${hypothesis.targetConcept}」的假說已歸檔。原因：此假說被更顯著的競爭假說覆蓋（後驗概率：${confidencePct}%，不確定性：${uncertaintyPct}%）。`;
    }

    if (status === "ACCEPTED") {
      return `【確證假說】${hypothesis.description}（統計信心度：${confidencePct}%，不確定性已降至 ${uncertaintyPct}%，基於 ${count} 個獨立證據鏈支持）。`;
    }

    // 預設 (NEW / VERIFIED 狀態)
    return `【探索中假說】我們正在驗證關於您喜好「${hypothesis.targetConcept}」的品味假設（目前信心度：${confidencePct}%，不確定性：${uncertaintyPct}%，觀測到 ${count} 個關聯特徵）。`;
  }
}
