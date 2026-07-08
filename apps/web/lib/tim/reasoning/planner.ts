/**
 * TIM Core — Experiment Planner
 * 
 * 實驗規劃器。負責將 Scientific DSL 解析成具體的驗證需求 (EvidenceRequirements)，
 * 引動後續實證檢索。
 */

import type { ScientificWorkflowDSL, EvidenceRequirement } from "./scientific_dsl";

export class ExperimentPlanner {
  /**
   * 依據 Scientific DSL 規劃研究所需的證據要求
   */
  plan(dsl: ScientificWorkflowDSL): readonly EvidenceRequirement[] {
    return dsl.experiment.requirements;
  }
}
