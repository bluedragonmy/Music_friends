/**
 * Music Knowledge Graph v1.2 — 驗證腳本
 *
 * 測試最新調整：
 * 1. 忠於事實，移除 Charlie Puth -> 250 直接邊。
 * 2. 遍歷引擎 (discoverBridge) 能主動尋訪多階 (Multi-depth) 的關聯路徑。
 * 3. 測試 Entity 與 Edge 上新增的所有細節屬性 (factSource, aliases, country, confidence 等)。
 */

import { createSeededGraph, discoverBridge } from "../index";

function verify() {
  const graph = createSeededGraph();
  const stats = graph.getStats();
  let passed = 0;
  let failed = 0;

  console.log("=== Music Knowledge Graph v1.2 — Verification ===\n");
  console.log(`Graph loaded: ${stats.entityCount} entities, ${stats.edgeCount} edges\n`);

  // --- Test 1: Charlie Puth ↔ NewJeans (應能透過多階路徑找到關聯) ---
  console.log("--- Test 1: discoverBridge(['Charlie Puth', 'NewJeans']) ---");
  const result1 = discoverBridge(graph, ["Charlie Puth", "NewJeans"]);

  if (result1.length > 0) {
    const entry = result1[0];
    console.log(`✅ PASS: Found ${entry.paths.length} connection paths between ${entry.source.name} and ${entry.target.name}`);
    
    // 印出所有路徑
    entry.paths.forEach((path, idx) => {
      console.log(`   Path #${idx + 1} (length: ${path.length} steps):`);
      path.steps.forEach((step, stepIdx) => {
        const edgeDesc = step.edge ? ` --[${step.edge.type} (${step.edge.factSource})]--> ` : "";
        console.log(`     ${edgeDesc}${step.entity.name} (${step.entity.type})`);
        if (step.edge) {
          console.log(`       Fact: "${step.edge.fact}"`);
        }
      });
    });
    passed++;
  } else {
    console.log("❌ FAIL: Did not find any connection path between Charlie Puth and NewJeans");
    failed++;
  }

  console.log();

  // --- Test 2: Taylor Swift ↔ Lorde ---
  console.log("--- Test 2: discoverBridge(['Taylor Swift', 'Lorde']) ---");
  const result2 = discoverBridge(graph, ["Taylor Swift", "Lorde"]);

  if (result2.length > 0) {
    const entry = result2[0];
    console.log(`✅ PASS: Found ${entry.paths.length} connection paths between ${entry.source.name} and ${entry.target.name}`);
    entry.paths.slice(0, 3).forEach((path, idx) => {
      console.log(`   Path #${idx + 1} (length: ${path.length} steps):`);
      path.steps.forEach((step) => {
        const edgeDesc = step.edge ? ` --[${step.edge.type}]--> ` : "";
        console.log(`     ${edgeDesc}${step.entity.name} (${step.entity.type})`);
      });
    });
    passed++;
  } else {
    console.log("❌ FAIL: Did not find any connection path between Taylor Swift and Lorde");
    failed++;
  }

  console.log();

  // --- Test 3: 驗證 Entity 資料豐富度 ---
  console.log("--- Test 3: Entity Metadata & Metadata Fields ---");
  const producer250 = graph.findEntity("250");
  if (
    producer250 &&
    producer250.aliases?.includes("이오공") &&
    producer250.country === "KR" &&
    producer250.roles?.includes("producer") &&
    producer250.links?.spotify &&
    producer250.confidence === "verified"
  ) {
    console.log("✅ PASS: Entity 250 has correct aliases, country, roles, links, and confidence");
    console.log("   Data:", JSON.stringify(producer250, null, 2));
    passed++;
  } else {
    console.log("❌ FAIL: Entity 250 is missing enriched fields");
    console.log("   Got:", producer250);
    failed++;
  }

  console.log();

  // --- Test 4: 遍歷事件與細節 (Podcast Event) ---
  console.log("--- Test 4: Event entity details ---");
  const eventNode = graph.findEntity("charlie_puth_demo_to_250");
  if (eventNode && eventNode.type === "event" && eventNode.links?.youtube) {
    console.log(`✅ PASS: Found event node with source links: "${eventNode.name}"`);
    passed++;
  } else {
    console.log("❌ FAIL: Event node verification failed");
    failed++;
  }

  console.log();
  console.log("=== Results ===");
  console.log(`${passed} passed, ${failed} failed, ${passed + failed} total`);

  if (failed > 0) {
    process.exit(1);
  }
}

verify();
