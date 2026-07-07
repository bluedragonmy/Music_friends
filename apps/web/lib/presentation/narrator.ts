// =============================================================================
// Narrator — 負責將 RevealDTO 翻譯為對話式的人類語言文案
// =============================================================================

import { RevealDTO } from "./presenter";
import { LOCALIZED_FACTS, FactId } from "../graph/edge";

export interface PresentedStep {
  readonly entityName: string;
  readonly type: string;
  readonly connectionDetails?: {
    readonly relation: string;
    readonly fact: string;
    readonly evidences: readonly {
      readonly factId: string;
      readonly sources: readonly {
        readonly type: string;
        readonly title: string;
        readonly url?: string;
        readonly directness: string;
        readonly retrievedAt?: string;
      }[];
    }[];
  };
}

export interface PresentedRevelation {
  readonly id: string;
  readonly title: string;
  readonly introduction: string;
  readonly steps: readonly PresentedStep[];
  readonly score: number;
}

export class Narrator {
  /**
   * 讀取 RevealDTO，進行對話文案的 Narrating {講述/描繪}，轉化為前端所要求的 UI 呈現格式。
   */
  static narrate(dto: RevealDTO): PresentedRevelation {
    const steps = dto.path.steps;
    const sourceName = steps[0].entity.name;
    const endName = steps[steps.length - 1].entity.name;
    
    // 依據中介實體 (Bridge Node) 與終點實體動態組合高辨識度標題
    const hasEvent = steps.some((s) => s.entity.type === "event");
    const hasProducer = steps.some((s) => s.entity.type === "producer");
    const bridgeEntity = steps.length > 2 ? steps[1].entity : null;

    let title = `關於 ${sourceName} 的隱秘故事`;
    let introduction = `你知道嗎？你常聽的 ${sourceName}，與 ${endName} 之間存在著意想不到的驚喜關連。`;

    if (hasEvent) {
      const eventStep = steps.find((s) => s.entity.type === "event");
      title = `${sourceName} ↔ ${endName}：透過真實事件「${eventStep?.entity.name}」的關聯`;
      introduction = `這是一段藏在 ${sourceName} 背後的真實事件。透過「${eventStep?.entity.name}」，牽起了音樂世界的奇妙線索。`;
    } else if (hasProducer) {
      const producerStep = steps.find((s) => s.entity.type === "producer");
      title = `製作人 ${producerStep?.entity.name} 牽線：${sourceName} 至 ${endName} 的幕後路徑`;
      introduction = `這是一段透過頂尖製作人 ${producerStep?.entity.name} 牽引的隱藏路徑。讓我們看看這段從 ${sourceName} 連通至 ${endName} 的精彩旅程。`;
    } else if (bridgeEntity) {
      title = `透過 ${bridgeEntity.name}：${sourceName} ↔ ${endName} 的連通`;
      introduction = `這是一段經由 ${bridgeEntity.name} 牽引的隱密軌跡。`;
    }

    const presentedSteps: PresentedStep[] = steps.map((step) => {
      const dtoEvidence = dto.evidence.find((e) => e.entityId === step.entity.id);
      return {
        entityName: step.entity.name,
        type: step.entity.type,
        ...(step.edge && dtoEvidence ? {
          connectionDetails: {
            relation: step.edge.type,
            fact: LOCALIZED_FACTS[dtoEvidence.factId as FactId]?.zh || "真實客觀的音樂關聯",
            evidences: dtoEvidence.evidences,
          }
        } : {})
      };
    });

    return {
      id: dto.id,
      title,
      introduction,
      steps: presentedSteps,
      score: dto.score,
    };
  }

  /**
   * 批次處理
   */
  static narrateMany(dtos: readonly RevealDTO[]): readonly PresentedRevelation[] {
    return dtos.map((dto) => this.narrate(dto));
  }
}
