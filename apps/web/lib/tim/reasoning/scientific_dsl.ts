/**
 * TIM Core — Scientific DSL Definitions
 * 
 * 定義通用科學推理引擎的型別、信念狀態以及 DSL 格式。
 * 本模組是 Domain-agnostic {領域無關} 的，不包含任何音樂或特定領域的詞彙。
 */

export interface BeliefState {
  readonly posterior: number;                // 後驗機率 (0.0 - 1.0)
  readonly uncertainty: number;              // 不確定度 (0.0 - 1.0)
  readonly evidenceCount: number;            // 支持此假說的證據數量
  readonly contradictoryEvidence: number;    // 與此假說矛盾的證據數量
  readonly updatedAt: string;                // 更新時間戳記
}

export interface EvidenceRequirement {
  readonly type: string;                     // 證據類別需求，如 "ProducerCredit"、"TempoRange"
  readonly key: string;                      // 連接關鍵字
}

export interface ScientificWorkflowDSL {
  readonly id: string;                       // 假說規則 ID，例如 "shared_producer_workflow"
  readonly hypothesisName: string;           // 假說名稱模板，例如 "Shared Producer: {name}"
  readonly observe: string;                  // 觀察目標，例如 "ListeningHistory"
  readonly targetType: string;               // 目標實體型別，例如 "PRODUCER"
  readonly experiment: {
    readonly requirements: readonly EvidenceRequirement[]; // 驗證所需的證據條件
    readonly rejectIf: {
      readonly minEvidenceCount: number;      // 當證據數量低於此值時拒絕
      readonly maxContradictory: number;     // 當矛盾證據大於此值時拒絕
    };
    readonly acceptIf: {
      readonly minPosterior: number;         // 當後驗機率大於此值時接受
    };
  };
  readonly templates: {
    readonly narrative: string;              // 故事描述模板
  };
}

export interface TasteHypothesis {
  readonly id: string;
  readonly workflowId: string;
  readonly targetConcept: string;            // 例如 '250' 或 'Minimalism'
  readonly title: string;
  readonly description: string;
  readonly priorProbability: number;
}

export interface EvidenceChain {
  readonly path: readonly string[];          // 匹配的路徑實體 ID
  readonly confidence: number;               // 證據置信度
  readonly sources: readonly {
    readonly type: string;
    readonly title: string;
    readonly url?: string;
  }[];
}

export interface ReasoningTrace {
  readonly ruleId: string;
  readonly matchedPath: readonly string[];
  readonly timestamp: string;
  readonly failureReason?: string;           // 當假說被 Reject 時的具體理由
}

export type HypothesisStatus = "NEW" | "VERIFIED" | "ACCEPTED" | "REJECTED" | "ARCHIVED";

export interface EvaluatedHypothesis {
  readonly hypothesis: TasteHypothesis;
  readonly status: HypothesisStatus;
  readonly belief: BeliefState;
  readonly evidenceChains: readonly EvidenceChain[];
  readonly reasoningTrace: readonly ReasoningTrace[];
  readonly failureReason?: string;
}
