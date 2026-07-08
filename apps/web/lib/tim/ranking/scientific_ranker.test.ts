/**
 * TIM 1.0 MVC — Scientific Reasoning Engine Unit Tests
 * 
 * 測試通用科學推理引擎在音樂 Plugin 下的驗證閉環，
 * 包括 DSL 載入、實驗規劃、證據檢索、貝氏信念更新、Accept/Reject 判定、競爭仲裁與敘事生成。
 * 
 * 執行命令：npx tsx apps/web/lib/tim/ranking/scientific_ranker.test.ts
 */

import assert from "assert";
import { createSeededGraph } from "../../graph/graph";
import { TIMGraphQueryAdapter } from "../knowledge/query";
import { TIMEvidenceStoreAdapter } from "../knowledge/evidence";
import { MusicDomainAdapter } from "../domains/music/music_adapter";
import { ScientificReasoningEngine, ObservationEvent } from "../reasoning/core_engine";
import { NarrativeGenerator } from "../narrator/narrative";
import type { ScientificWorkflowDSL } from "../reasoning/scientific_dsl";

// ─── 載入科學工作流規則 (DSL) ─────────────────────────────────────────
import musicRulesRaw from "../domains/music/rules.json";
const musicRules = musicRulesRaw as unknown as readonly ScientificWorkflowDSL[];

// ─── 建立測試用組件 ───────────────────────────────────────────────────
const graph = createSeededGraph();
const queryAdapter = new TIMGraphQueryAdapter(graph);
const evidenceStore = new TIMEvidenceStoreAdapter();
const musicAdapter = new MusicDomainAdapter(queryAdapter, evidenceStore);
const engine = new ScientificReasoningEngine(musicAdapter);
const narrator = new NarrativeGenerator();

console.log("🧪 開始執行 TIM 1.0 MVC 科學推理引擎自動化測試...");

// ─── 測試案例 1：合成用戶 A (NewJeans & 250) 實證確證 ────────────────────
async function testAcceptedHypothesis() {
  console.log("\n▶ [測試案例 1] 驗證合成用戶 A (NewJeans & 250) 的共同製作人假說是否 Accepted");

  // 模擬用戶 A 播放歷史：播放了由 250 製作的 Hype Boy 與 Attention
  const events: ObservationEvent[] = [
    {
      id: "event_1",
      timestamp: new Date().toISOString().split("T")[0],
      source: "Spotify",
      entityId: "hype_boy",
      action: "PLAY",
      weight: 1.0
    },
    {
      id: "event_2",
      timestamp: new Date().toISOString().split("T")[0],
      source: "Spotify",
      entityId: "attention",
      action: "PLAY",
      weight: 1.0
    }
  ];

  const results = await engine.execute(events, musicRules);

  // 尋找 250 製作人假說
  const hypothesis250 = results.find(
    r => r.hypothesis.workflowId === "shared_producer_workflow" && r.hypothesis.targetConcept === "250"
  );

  assert.ok(hypothesis250, "系統應針對 250 產生製作人假說");
  assert.strictEqual(hypothesis250.status, "ACCEPTED", "250 的製作人假說應為 ACCEPTED");
  assert.ok(hypothesis250.belief.posterior > 0.75, `250 後驗機率應大於 0.75，目前為 ${hypothesis250.belief.posterior}`);
  assert.ok(hypothesis250.evidenceChains.length >= 2, "應該至少檢索到 2 個證據鏈 (Hype Boy & Attention)");
  assert.strictEqual(hypothesis250.belief.evidenceCount, hypothesis250.evidenceChains.length, "證據計數應與鏈條數一致");

  // 測試敘事生成
  const reportText = narrator.generate(hypothesis250);
  console.log(`   [Narrative Report]\n   ${reportText}`);
  assert.ok(reportText.includes("確證假說"), "敘事報告應包含「確證假說」標記");
  assert.ok(reportText.includes("250"), "敘事報告應包含目標製作人名稱");

  console.log("✅ 測試案例 1 通過！");
}

// ─── 測試案例 2：被拒絕的假說與歸檔 (Rejected & Archived) ───────────────
async function testRejectedHypothesis() {
  console.log("\n▶ [測試案例 2] 驗證無關或證據不足的假說是否被 Reject 並歸檔");

  // 使用相同播放歷史，但我們有 Artistic Genealogy 假說（在 SEED_ENTITIES 中有許多未被觸及的藝人，如 charlie_puth，因缺乏證據應被駁回）
  const events: ObservationEvent[] = [
    {
      id: "event_1",
      timestamp: new Date().toISOString().split("T")[0],
      source: "Spotify",
      entityId: "hype_boy",
      action: "PLAY",
      weight: 1.0
    }
  ];

  const results = await engine.execute(events, musicRules);

  // 尋找 Charlie Puth 的藝術傳承假說 (因為沒有聽 Charlie Puth，證據應為 0)
  const charlieHypothesis = results.find(
    r => r.hypothesis.workflowId === "influenced_by_workflow" && r.hypothesis.targetConcept === "charlie_puth"
  );

  if (charlieHypothesis) {
    assert.strictEqual(charlieHypothesis.status, "REJECTED", "缺乏證據的假說應為 REJECTED");
    assert.ok(charlieHypothesis.failureReason, "被拒絕的假說應有明確的 failureReason");
    assert.ok(charlieHypothesis.failureReason.includes("Evidence Too Weak"), "失敗理由應指出證據太弱");

    // 驗證是否在 Rejected 歸檔庫中
    const archive = engine.getArchive();
    const archivedItem = archive.find(a => a.hypothesis.id === charlieHypothesis.hypothesis.id);
    assert.ok(archivedItem, "被拒絕的假說應被歸檔至 HypothesisArchive");

    const reportText = narrator.generate(charlieHypothesis);
    console.log(`   [Narrative Report]\n   ${reportText}`);
    assert.ok(reportText.includes("已駁回假說"), "被駁回假說應顯示駁回提示");
  }

  console.log("✅ 測試案例 2 通過！");
}

// ─── 測試案例 3：競爭假說 (Competing Hypotheses) 仲裁 ──────────────────
async function testCompetingHypotheses() {
  console.log("\n▶ [測試案例 3] 驗證競爭假說的 Winner 篩選與仲裁");

  // 模擬觸發複數假說。比如我們聽了 hype_boy 且為其點擊 LIKE (權重倍增)，
  // 而對 attention 點擊了 SKIP (權重削弱)，這會導致 250 的後驗機率在兩首歌上產生拉扯，
  // 或是當產生兩個同類假說時，我們驗證最大後驗機率 MAP 篩選是否生效。
  // 我們可以使用一個合成的 DSL 與兩個目標來強行觸發同類型 workflow 的競爭。
  // 在 execute 中，我們將 workflowId 作為 group key，若同一個 workflow 中有多個目標 ACCEPTED，
  // 則只保留後驗機率最高者為 ACCEPTED，其餘轉為 ARCHIVED。
  
  // 我們讓用戶播放 hype_boy 和 attention，此時會觸發 250 假說（有 2 個證據）。
  // 我們再模擬另一個製作人（假設為 FRNK），因為用戶沒聽過對應的歌，FRNK 假說被 reject，所以 250 勝出。
  // 為了解決這個，我們在圖譜中加入另一個製作人與其製作的歌曲到播放歷史中，
  // 例如我們聽了 FRNK 製作的歌曲 (用戶播放 frnk 和 250 相關歌曲)，
  // 看看 250 和 FRNK 是否產生競爭，且只有 posterior 最高的一個保持 ACCEPTED。
  
  // 我們看 SEED_ENTITIES 中有：
  // "frnk" (producer), XXX duo 
  // 由於 DSL rules 中的 shared_producer_workflow 目標是 PRODUCER，
  // 如果我們聽了：
  // 1. Attention (250 製作，播放 5 次 -> 權重高)
  // 2. 某首 FRNK 製作的歌 (假設為 mock 歌，播放 1 次 -> 權重低)
  // 兩者皆有證據支持，但 250 的後驗機率將高於 FRNK。
  // 驗證結果：250 保持 ACCEPTED，FRNK 應該被歸類為 ARCHIVED 並標示被 250 覆蓋。

  // 我們需要在圖譜中手動加一條邊或利用現有邊。
  // 在 SEED_ENTITIES 中沒有 FRNK 製作的歌曲節點，但我們可以模擬播放：
  // 我們在圖譜中手動新增一首歌曲，並加入 frnk 製作的邊：
  const frnkSong = {
    id: "frnk_song_test",
    name: "FRNK Song Test",
    type: "song" as const,
    metadata: { artistId: "xxx_band" }
  };
  graph.addEntity(frnkSong);
  graph.addEdge({
    source: "frnk_song_test",
    target: "frnk",
    type: "PRODUCED",
    isTrivial: false,
    evidences: [
      {
        factId: "frnk_produced_test",
        sources: [
          {
            type: 27, // Credits
            title: "FRNK Credits Test",
            directness: "Primary",
            retrievedAt: "2026-07-01",
            url: "https://spotify.com"
          }
        ]
      }
    ]
  });

  // 播放 Attention 5 次 (250 製作)，播放 FRNK Song 1 次
  const events: ObservationEvent[] = [
    { id: "e1", timestamp: "2026-07-08", source: "Spotify", entityId: "attention", action: "PLAY", weight: 5.0 },
    { id: "e2", timestamp: "2026-07-08", source: "Spotify", entityId: "frnk_song_test", action: "PLAY", weight: 3.5 }
  ];

  const results = await engine.execute(events, musicRules);

  const eval250 = results.find(r => r.hypothesis.targetConcept === "250");
  const evalFrnk = results.find(r => r.hypothesis.targetConcept === "frnk");

  assert.ok(eval250, "應該有 250 假說");
  assert.ok(evalFrnk, "應該有 frnk 假說");

  console.log(`   [Competing Posterior] 250: ${eval250.belief.posterior.toFixed(4)} (${eval250.status}), FRNK: ${evalFrnk.belief.posterior.toFixed(4)} (${evalFrnk.status})`);

  // 驗證 250 勝出為 ACCEPTED，而 FRNK 因為 posterior 較低，在競爭仲裁中被 ARCHIVED
  assert.strictEqual(eval250.status, "ACCEPTED", "250 應為 ACCEPTED");
  assert.strictEqual(evalFrnk.status, "ARCHIVED", "FRNK 應被仲裁轉為 ARCHIVED");
  assert.ok(evalFrnk.failureReason?.includes("Archived due to competing hypothesis winning"), "FRNK 應有競爭失敗歸檔原因");

  const frnkReport = narrator.generate(evalFrnk);
  console.log(`   [Narrative Report Competing]\n   ${frnkReport}`);
  assert.ok(frnkReport.includes("封存假說"), "封存假說敘事生成應包含封存標記");

  console.log("✅ 測試案例 3 通過！");
}

async function runAllTests() {
  try {
    await testAcceptedHypothesis();
    await testRejectedHypothesis();
    await testCompetingHypotheses();
    console.log("\n🎉 所有 TIM 1.0 MVC 科學推理核心測試皆順利完成！");
  } catch (err) {
    console.error("\n❌ 測試執行失敗：", err);
    process.exit(1);
  }
}

runAllTests();
