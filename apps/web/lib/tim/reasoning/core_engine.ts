/**
 * TIM Core — Scientific Reasoning Engine
 * 
 * 通用科學推理引擎。採用 Observation -> Hypothesis Space -> Experiment Planner -> 
 * Evidence Retrieval -> Belief Update -> Accept/Reject 的實證驗證管線。
 */

import type {
  BeliefState,
  EvidenceRequirement,
  ScientificWorkflowDSL,
  TasteHypothesis,
  EvidenceChain,
  ReasoningTrace,
  EvaluatedHypothesis,
  HypothesisStatus
} from "./scientific_dsl";
import { ExperimentPlanner } from "./planner";
import { TIM_CONFIG } from "../config";

export interface ObservationEvent {
  readonly id: string;
  readonly timestamp: string;         // YYYY-MM-DD
  readonly source: string;            // 例如 'Spotify'
  readonly entityId: string;          // 實體 ID (例如歌曲 ID)
  readonly action: "PLAY" | "LIKE" | "SKIP" | "REPLAY";
  readonly weight: number;
}

export interface DomainAdapter {
  /** 依據驗證需求與用戶播放實體清單，尋找支援該 targetEntityId 的證據鏈 */
  findEvidenceChains(
    targetEntityId: string,
    requirements: readonly EvidenceRequirement[],
    userHistoryEntities: readonly string[]
  ): Promise<readonly EvidenceChain[]>;

  /** 從用戶播放實體清單中，動態尋找符合 targetType 的候選目標實體 */
  findCandidateTargets(
    userHistoryEntities: readonly string[],
    targetType: string
  ): Promise<readonly string[]>;
}

export class ScientificReasoningEngine {
  private readonly planner = new ExperimentPlanner();
  private readonly hypothesisArchive: EvaluatedHypothesis[] = [];

  constructor(private readonly domainAdapter: DomainAdapter) {}

  /**
   * 執行科學推理驗證管線，產出評估後的假說列表
   */
  async execute(
    events: readonly ObservationEvent[],
    workflows: readonly ScientificWorkflowDSL[]
  ): Promise<readonly EvaluatedHypothesis[]> {
    const userHistoryEntities = Array.from(new Set(events.map(e => e.entityId)));
    const evaluated: EvaluatedHypothesis[] = [];

    // 計算時間衰減權重，並取得用戶最近播放的實體權重
    const todayMs = new Date().getTime();
    const entityWeights = new Map<string, number>();

    for (const event of events) {
      const diffDays = Math.max(0, (todayMs - new Date(event.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      // weight(t) = e^(-λ * Δt)
      const decay = Math.exp(-TIM_CONFIG.DECAY_CONSTANT_LAMBDA * diffDays);
      const actionMult = event.action === "SKIP" ? -0.5 : event.action === "LIKE" ? 1.5 : 1.0;
      const finalWeight = event.weight * decay * actionMult;

      const current = entityWeights.get(event.entityId) ?? 0;
      entityWeights.set(event.entityId, current + finalWeight);
    }

    for (const dsl of workflows) {
      // 1. Generation Phase: 尋找候選假說目標
      const candidates = await this.domainAdapter.findCandidateTargets(
        userHistoryEntities,
        dsl.observe === "ListeningHistory" ? dsl.targetType : "UNKNOWN"
      );

      for (const targetId of candidates) {
        // 2. Planning Phase: 規劃驗證需求
        const requirements = this.planner.plan(dsl);

        // 3. Retrieval Phase: 尋找證據鏈
        const evidenceChains = await this.domainAdapter.findEvidenceChains(
          targetId,
          requirements,
          userHistoryEntities
        );

        // 4. Belief Update Phase: 貝氏信念更新
        const prior = 0.5; // 先驗機率 (MVC 設為 0.5)
        let posterior = prior;
        let evidenceCount = 0;
        let contradictoryEvidence = 0;

        const traces: ReasoningTrace[] = [];

        // 計算該 target 關聯的所有用戶聽歌權重之平均作為實證概度加權
        let userEngagementWeight = 0;
        const targetRelatedHistoryIds = new Set<string>();
        for (const chain of evidenceChains) {
          if (chain.path.length > 0) {
            targetRelatedHistoryIds.add(chain.path[0]);
          }
        }
        for (const hid of targetRelatedHistoryIds) {
          userEngagementWeight += entityWeights.get(hid) ?? 0;
        }
        if (targetRelatedHistoryIds.size > 0) {
          userEngagementWeight /= targetRelatedHistoryIds.size;
        } else {
          userEngagementWeight = 0.1;
        }

        for (const chain of evidenceChains) {
          evidenceCount++;
          // 概度 P(E | H) 設為 0.85，P(E | ~H) 設為 0.2
          const pGivenH = 0.85 * chain.confidence;
          const pGivenNotH = 0.20;

          // 結合用戶參與度權重 (往無資訊的 0.5 拉近)
          const engagementDecay = Math.min(1.0, Math.max(0.1, userEngagementWeight));
          const adjustedPGivenH = 0.5 + (pGivenH - 0.5) * engagementDecay;
          const adjustedPGivenNotH = 0.5 + (pGivenNotH - 0.5) * engagementDecay;

          // 貝氏公式更新後驗機率
          const numerator = posterior * adjustedPGivenH;
          const denominator = numerator + (1 - posterior) * adjustedPGivenNotH;
          posterior = denominator > 0 ? numerator / denominator : posterior;

          traces.push({
            ruleId: dsl.id,
            matchedPath: chain.path,
            timestamp: new Date().toISOString()
          });
        }

        const uncertainty = 1.0 - posterior;
        const belief: BeliefState = {
          posterior,
          uncertainty,
          evidenceCount,
          contradictoryEvidence,
          updatedAt: new Date().toISOString()
        };

        const tasteHypothesis: TasteHypothesis = {
          id: `${dsl.id}_${targetId}`,
          workflowId: dsl.id,
          targetConcept: targetId,
          title: dsl.hypothesisName.replace("{name}", targetId),
          description: dsl.templates.narrative.replace("{name}", targetId),
          priorProbability: prior
        };

        // 5. Decision Phase: Accept / Reject / Archive
        let status: HypothesisStatus = "NEW";
        let failureReason: string | undefined;

        if (evidenceCount < dsl.experiment.rejectIf.minEvidenceCount) {
          status = "REJECTED";
          failureReason = "Evidence Too Weak (evidence count below threshold)";
        } else if (contradictoryEvidence > dsl.experiment.rejectIf.maxContradictory) {
          status = "REJECTED";
          failureReason = "Contradictory Evidence Exceeded";
        } else if (posterior >= dsl.experiment.acceptIf.minPosterior) {
          status = "ACCEPTED";
        } else {
          status = "REJECTED";
          failureReason = "Posterior probability below threshold";
        }

        const evaluatedHypothesis: EvaluatedHypothesis = {
          hypothesis: tasteHypothesis,
          status,
          belief,
          evidenceChains,
          reasoningTrace: status === "REJECTED" ? traces.map(t => ({ ...t, failureReason })) : traces,
          failureReason
        };

        if (status === "REJECTED") {
          this.hypothesisArchive.push(evaluatedHypothesis);
        }

        evaluated.push(evaluatedHypothesis);
      }
    }

    // 6. Competing Hypotheses: 最大後驗機率 MAP 競爭仲裁
    // 在同一個 observe / targetType 底下，若有複數 Accepted 假說，我們對其進行排序，
    // 只有後驗機率最高（即最顯著）的 Winner 能保持 ACCEPTED，其他的被移入 ARCHIVED / REJECTED
    const acceptedOnly = evaluated.filter(e => e.status === "ACCEPTED");
    const winners = new Map<string, EvaluatedHypothesis>();

    for (const h of acceptedOnly) {
      const key = `${h.hypothesis.workflowId}`;
      const currentWinner = winners.get(key);
      if (!currentWinner || h.belief.posterior > currentWinner.belief.posterior) {
        winners.set(key, h);
      }
    }

    const finalEvaluated = evaluated.map(h => {
      if (h.status === "ACCEPTED") {
        const winner = winners.get(`${h.hypothesis.workflowId}`);
        if (winner && winner.hypothesis.id !== h.hypothesis.id) {
          return {
            ...h,
            status: "ARCHIVED" as const,
            failureReason: `Archived due to competing hypothesis winning: ${winner.hypothesis.id}`
          };
        }
      }
      return h;
    });

    return finalEvaluated;
  }

  /**
   * 取得被拒絕假說封存庫中的所有歷史假說
   */
  getArchive(): readonly EvaluatedHypothesis[] {
    return this.hypothesisArchive;
  }
}
