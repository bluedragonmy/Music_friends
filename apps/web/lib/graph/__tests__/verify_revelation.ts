/**
 * Music World Model & Dynamic User World Projection — 整合驗證腳本
 *
 * 驗證目標：
 * 1. 相同 Music World Model，在不同 User Projection 的情況下，是否投影並揭露出截然不同的結果。
 * 2. 測試 RevealService 整合 Repository, Builder, CandidateGenerator, Traversal, Evaluator, Presenter, Narrator 的 Orchestration 流程。
 */

import { RevealService } from "../../services/reveal";
import { ListeningRepository } from "../../repositories/listening";
import { UserProjectionBuilder } from "../user_projection";

async function verify() {
  console.log("=== Reveal Service Orchestrator & Evidence — 整合驗證 ===\n");

  const testEmails = [
    { email: "test_b@example.com", label: "User B (K-pop 追星族 — 聽 NewJeans)" },
    { email: "test_d@example.com", label: "User D (Swiftie 粉絲 — 只聽 Taylor Swift)" },
    { email: "test_e@example.com", label: "User E (純粹 Jazz 聽眾 — 聽爵士小號)" },
    { email: "test_silent@example.com", label: "User F (真實獨立樂迷 — 聽 Radiohead & Erik Satie)" },
    { email: "411121217@gms.ndhu.edu.tw", label: "李彥龍 (真實 Spotify 登入用戶)" },
    { email: "aaronlee0715@gmail.com", label: "Aaron (您登入的開發者預覽帳戶)" }
  ];

  for (const { email, label } of testEmails) {
    console.log(`\n==================================================`);
    console.log(`👤 測試對象: ${label}`);
    console.log(`📧 Email: ${email}`);
    console.log(`==================================================`);

    try {
      // 1. 單獨驗證 UserProjection 及其行為證據 (Evidence)
      const profile = await ListeningRepository.getListeningProfileByEmail(email);
      if (profile) {
        const projection = UserProjectionBuilder.buildProjection(profile);
        console.log("\n[Step 1: User Projection & Behavioral Evidence]");
        const entities = Object.values(projection.entities);
        if (entities.length === 0) {
          console.log("   (投影已知節點為空)");
        } else {
          entities.forEach(entity => {
            console.log(`   ★ Entity ID: ${entity.entityId}`);
            entity.evidence.forEach(ev => {
              console.log(`     - [${ev.type}] ${ev.value} (Timestamp: ${ev.timestamp.toLocaleDateString()})`);
            });
          });
        }
      }

      // 2. 呼叫整合服務獲取 payload
      const payload = await RevealService.getRevelationForUser(email);
      const { data, metadata } = payload;

      // 3. 印出遍歷路徑數與 Debug Metadata
      console.log(`\n[Step 2: Traversal & Evaluation Metadata]`);
      console.log(`   搜尋世界節點數 (searched_nodes): ${metadata.searched_nodes}`);
      console.log(`   遍歷最大深度 (search_depth): ${metadata.search_depth}`);
      console.log(`   連通路徑數 (candidate_paths): ${metadata.candidate_paths}`);
      console.log(`   選用路徑 ID (selected_path): ${metadata.selected_path}`);
      console.log(`   未選用路徑數 (rejected_paths): ${metadata.rejected_paths}`);
      console.log(`   圖譜版本 (graph_version): ${metadata.graph_version}`);

      // 4. 印出評分與 Presenter 翻譯後的最終 Revelation
      console.log("\n[Step 3: Primary Ranked Revelation (Narrator Output)]");
      if (!data.revelation) {
        console.log("   ❌ 無法生成任何主揭露 (沒有能連通至未知節點的有效路徑)");
      } else {
        const rev = data.revelation;
        console.log(`   ★ [Curiosity Score: ${rev.score}]`);
        console.log(`     標題: "${rev.title}"`);
        console.log(`     導言: "${rev.introduction}"`);
        console.log(`     描述 steps:`);
        rev.steps.forEach((step, stepIdx) => {
          const edgeDesc = step.connectionDetails 
            ? `  --[${step.connectionDetails.relation} (Source: ${step.connectionDetails.evidences[0]?.sources[0]?.title || "N/A"})]--> ` 
            : "";
          console.log(`       ${edgeDesc}${step.entityName} (${step.type})`);
          if (step.connectionDetails) {
            console.log(`         Fact: "${step.connectionDetails.fact}"`);
          }
        });
      }

    } catch (e: any) {
      console.error(`❌ 執行失敗:`, e.message);
    }
  }
}

verify();
