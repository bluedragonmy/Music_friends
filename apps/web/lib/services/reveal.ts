// =============================================================================
// RevealService — 音樂揭露引擎服務層 (Orchestrator)
// =============================================================================

import { ListeningRepository } from "../repositories/listening";
import { MusicKnowledgeGraph, createSeededGraph } from "../graph/graph";
import { UserProjectionBuilder } from "../graph/user_projection";
import { extractKnownEntities, discoverCandidates, evaluateCuriosity } from "../graph/revelation";
import { Presenter } from "../presentation/presenter";
import { Narrator, PresentedRevelation } from "../presentation/narrator";

export interface RevealResponsePayload {
  readonly data: {
    readonly revelation: PresentedRevelation | null;
    readonly alternatives: readonly PresentedRevelation[];
  };
  readonly metadata: {
    readonly known_entities: readonly { id: string; name: string; type: string }[];
    readonly searched_nodes: number;
    readonly search_depth: number;
    readonly graph_version: string;
    readonly generated_at: string;
    readonly candidate_paths: number;
    readonly selected_path: string | null;
    readonly rejected_paths: number;
  };
}

export class RevealService {
  /**
   * 門面調度方法 (Orchestration)：協調整個 Dynamic User World Projection 管道
   */
  static async getRevelationForUser(
    email: string,
    timeWindowDays?: number,
    shuffle?: boolean
  ): Promise<RevealResponsePayload> {
    // 1. 載入 Music World Model {音樂世界模型}
    const worldGraph = createSeededGraph();

    // 2. 透過 ListeningRepository 讀取用戶的原始聆聽記錄
    const profile = await ListeningRepository.getListeningProfileByEmail(email);
    if (!profile) {
      throw new Error(`User with email ${email} not found`);
    }

    // 3. 透過 UserProjectionBuilder 在世界模型上投射出動態投影 Dynamic User World Projection
    const userProjection = UserProjectionBuilder.buildProjection(profile, { timeWindowDays });

    // 4. 提取已知節點集合 (Known Set)
    const knownSet = extractKnownEntities(userProjection, worldGraph);

    // 5. 進行多階路徑遍歷 (Traversal Known → Unknown)
    const paths = discoverCandidates(worldGraph, knownSet);

    // 6. 好奇心評估評分 (Curiosity Evaluator)
    const ranked = evaluateCuriosity(paths, userProjection);

    // 7. PRESENTATION LAYER: 透過 Presenter 生成極簡 DTO 資料傳輸結構
    const dtos = Presenter.present(ranked);

    // 8. COPYWRITING LAYER: 透過 Narrator 將 DTO 翻譯成對話式人類語言
    const presented = Narrator.narrateMany(dtos);

    let finalPresented = [...presented];
    if (shuffle && finalPresented.length > 1) {
      for (let i = finalPresented.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = finalPresented[i];
        finalPresented[i] = finalPresented[j];
        finalPresented[j] = temp;
      }
    }

    const revelation = finalPresented.length > 0 ? finalPresented[0] : null;
    const alternatives = finalPresented.slice(1);

    // 獲取投影中的節點名稱與類型
    const knownOutput = Object.keys(userProjection.entities).map(id => {
      const entity = worldGraph.findEntity(id);
      return {
        id,
        name: entity?.name || id,
        type: entity?.type || "unknown",
      };
    });

    const candidatePathsCount = paths.length;
    const selectedPathId = revelation ? revelation.id : null;
    const rejectedPathsCount = Math.max(0, candidatePathsCount - (revelation ? 1 : 0));

    // 讀取代表知識庫快照的版本，而非編譯 Git SHA Build Version
    const graphVersion = worldGraph.version || "seed-facts-2026-07-08";

    return {
      data: {
        revelation,
        alternatives,
      },
      metadata: {
        known_entities: knownOutput,
        searched_nodes: worldGraph.getStats().entityCount,
        search_depth: 3,
        graph_version: graphVersion,
        generated_at: new Date().toISOString(),
        candidate_paths: candidatePathsCount,
        selected_path: selectedPathId,
        rejected_paths: rejectedPathsCount,
      }
    };
  }
}
