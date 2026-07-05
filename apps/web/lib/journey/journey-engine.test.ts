import assert from "assert";
import { getRarityScore, observationRules } from "./observation-library";
import { generateCandidateJournals } from "./observation-engine";
import { getOrCreateTodayJournal } from "./narrative-engine";

console.log("🧪 Running Journey Engine Unit Tests...");

// 1. 測試 Rarity Score 轉換
{
  assert.strictEqual(getRarityScore("legendary"), 100);
  assert.strictEqual(getRarityScore("rare"), 75);
  assert.strictEqual(getRarityScore("uncommon"), 50);
  assert.strictEqual(getRarityScore("common"), 25);
  assert.strictEqual(getRarityScore("unknown" as any), 0);
  console.log("✅ Rarity Score tests passed.");
}

// 2. 測試範本變數渲染與規則結構
{
  const testRule = observationRules.find(r => r.id === "obs_novelty_explorer");
  assert.ok(testRule, "obs_novelty_explorer must exist");
  assert.strictEqual(testRule.category, "pattern");
  assert.strictEqual(testRule.rarity, "uncommon");
  assert.strictEqual(testRule.cooldown, 30);
  
  // 模擬變數替代
  const bodyText = `${testRule.microcopy.loop_step_1}\n\n${testRule.microcopy.loop_step_2}\n\n${testRule.microcopy.loop_step_3}`;
  const vars = { noveltyPercent: 82 };
  let rendered = bodyText;
  for (const [key, value] of Object.entries(vars)) {
    rendered = rendered.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  
  assert.ok(rendered.includes("82%"), "Should correctly replace template placeholders");
  console.log("✅ Template rendering tests passed.");
}

console.log("🎉 All Journey Engine local unit tests passed!");
