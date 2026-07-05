/**
 * μ(sic) Inference Engine v1 — Unit Tests
 * 
 * Tests the composable IdentityDefinition pattern,
 * level/confidence label mapping, and edge cases.
 */

import assert from "assert";
import {
  inferIdentity,
  inferAllIdentities,
  calculateRepresentativeness,
  IDENTITY_DEFINITIONS,
  BehaviorInput,
  AudioFeatureAverages,
  ENGINE_VERSION,
} from "./inference-engine";

// ─── Presentation Layer helpers (tested here since they're pure functions) ───

function toLevelLabel(score: number): string {
  if (score >= 0.7) return "High";
  if (score >= 0.3) return "Moderate";
  return "Low";
}

function toConfidenceLabel(confidence: number): string {
  if (confidence >= 0.7) return "Confident";
  if (confidence >= 0.3) return "Growing";
  return "Emerging";
}

// ─── Test Data ──────────────────────────────────────────────────────

const highExplorerInput: BehaviorInput = {
  novelty: 0.9,
  repeatRate: 0.1,
  genreDiversity: 0.8,
  sessionLength: 45,
  peakListeningHour: 14,
  confidence: 0.85,
};

const highCollectorInput: BehaviorInput = {
  novelty: 0.1,
  repeatRate: 0.9,
  genreDiversity: 0.2,
  sessionLength: 30,
  peakListeningHour: 10,
  confidence: 0.90,
};

const nightOwlInput: BehaviorInput = {
  novelty: 0.5,
  repeatRate: 0.3,
  genreDiversity: 0.5,
  sessionLength: 60,
  peakListeningHour: 23,
  confidence: 0.75,
};

const emotionalAudio: AudioFeatureAverages = {
  acousticness: 0.8,
  danceability: 0.3,
  energy: 0.2,
  instrumentalness: 0.1,
  liveness: 0.1,
  loudness: -10,
  speechiness: 0.05,
  tempo: 80,
  valence: 0.15,
};

console.log("🧪 Running Inference Engine v1 Unit Tests...");

// ─── Test 1: Engine Version ─────────────────────────────────────────
{
  assert.strictEqual(ENGINE_VERSION, "v1", "Engine version must be v1");
  console.log("✅ Engine version is v1.");
}

// ─── Test 2: Explorer Identity ──────────────────────────────────────
{
  const explorerDef = IDENTITY_DEFINITIONS.find((d) => d.id === "explorer")!;
  const result = inferIdentity(explorerDef, highExplorerInput, null);

  // Score = 0.9 * 0.6 + 0.8 * 0.4 = 0.54 + 0.32 = 0.86
  assert.ok(Math.abs(result.score - 0.86) < 0.01, `Explorer score should be ~0.86, got ${result.score}`);
  assert.strictEqual(result.id, "explorer");
  assert.strictEqual(result.engineVersion, "v1");
  assert.ok(result.why.length > 0, "Explorer must have a why explanation");
  assert.ok(result.reflection.length > 0, "Explorer must have a reflection");
  assert.strictEqual(toLevelLabel(result.score), "High");

  console.log("✅ Explorer identity inference passed.");
}

// ─── Test 3: Collector Identity ─────────────────────────────────────
{
  const collectorDef = IDENTITY_DEFINITIONS.find((d) => d.id === "collector")!;
  const result = inferIdentity(collectorDef, highCollectorInput, null);

  // Score = 0.9 * 1.0 = 0.9
  assert.ok(Math.abs(result.score - 0.9) < 0.01, `Collector score should be ~0.9, got ${result.score}`);
  assert.strictEqual(toLevelLabel(result.score), "High");

  console.log("✅ Collector identity inference passed.");
}

// ─── Test 4: Night Owl Identity ─────────────────────────────────────
{
  const nightOwlDef = IDENTITY_DEFINITIONS.find((d) => d.id === "night-owl")!;
  
  // Peak hour 23 → should be 1.0
  const result = inferIdentity(nightOwlDef, nightOwlInput, null);
  assert.strictEqual(result.score, 1.0, "Night Owl at hour 23 must be 1.0");
  assert.strictEqual(toLevelLabel(result.score), "High");

  // Peak hour 14 (daytime) → should be 0.0
  const daytimeInput = { ...nightOwlInput, peakListeningHour: 14 };
  const daytimeResult = inferIdentity(nightOwlDef, daytimeInput, null);
  assert.strictEqual(daytimeResult.score, 0.0, "Night Owl at hour 14 must be 0.0");
  assert.strictEqual(toLevelLabel(daytimeResult.score), "Low");

  // Peak hour 21 (transition) → should be 0.5
  const transitionInput = { ...nightOwlInput, peakListeningHour: 21 };
  const transitionResult = inferIdentity(nightOwlDef, transitionInput, null);
  assert.strictEqual(transitionResult.score, 0.5, "Night Owl at hour 21 must be 0.5");
  assert.strictEqual(toLevelLabel(transitionResult.score), "Moderate");

  console.log("✅ Night Owl identity inference passed.");
}

// ─── Test 5: Emotion Driven Identity ────────────────────────────────
{
  const emotionDef = IDENTITY_DEFINITIONS.find((d) => d.id === "emotion-driven")!;

  // With audio features: 0.8 * 0.3 + (1.0 - 0.15) * 0.4 + (1.0 - 0.2) * 0.3 = 0.24 + 0.34 + 0.24 = 0.82
  const result = inferIdentity(emotionDef, highExplorerInput, emotionalAudio);
  assert.ok(Math.abs(result.score - 0.82) < 0.01, `Emotion Driven score should be ~0.82, got ${result.score}`);
  assert.strictEqual(toLevelLabel(result.score), "High");

  // Without audio features: should be 0.0
  const noAudioResult = inferIdentity(emotionDef, highExplorerInput, null);
  assert.strictEqual(noAudioResult.score, 0.0, "Emotion Driven without audio must be 0.0");

  console.log("✅ Emotion Driven identity inference passed.");
}

// ─── Test 6: Batch Inference ────────────────────────────────────────
{
  const results = inferAllIdentities(highExplorerInput, emotionalAudio);
  assert.strictEqual(results.length, 4, "Must produce 4 identity results");
  
  // Every result must have all required fields
  for (const r of results) {
    assert.ok(r.id, "Must have id");
    assert.ok(r.displayName, "Must have displayName");
    assert.ok(typeof r.score === "number", "Must have numeric score");
    assert.ok(typeof r.confidence === "number", "Must have numeric confidence");
    assert.ok(r.why.length > 0, "Must have why");
    assert.ok(r.reflection.length > 0, "Must have reflection");
    assert.strictEqual(r.engineVersion, "v1", "Must be v1");
  }

  console.log("✅ Batch inference passed.");
}

// ─── Test 7: Representativeness ─────────────────────────────────────
{
  // 50 plays, 1 unique track → 1/10 = 0.1
  assert.ok(Math.abs(calculateRepresentativeness(50, 1) - 0.1) < 0.01);

  // 10 plays, 10 unique tracks → 10/10 = 1.0
  assert.strictEqual(calculateRepresentativeness(10, 10), 1.0);

  // 5 plays, 5 unique tracks → 5/5 = 1.0
  assert.strictEqual(calculateRepresentativeness(5, 5), 1.0);

  // 0 plays → 0.0
  assert.strictEqual(calculateRepresentativeness(0, 0), 0.0);

  console.log("✅ Representativeness calculation passed.");
}

// ─── Test 8: Presentation Layer Labels ──────────────────────────────
{
  assert.strictEqual(toLevelLabel(0.85), "High");
  assert.strictEqual(toLevelLabel(0.7), "High");
  assert.strictEqual(toLevelLabel(0.5), "Moderate");
  assert.strictEqual(toLevelLabel(0.3), "Moderate");
  assert.strictEqual(toLevelLabel(0.29), "Low");
  assert.strictEqual(toLevelLabel(0.0), "Low");

  assert.strictEqual(toConfidenceLabel(0.8), "Confident");
  assert.strictEqual(toConfidenceLabel(0.5), "Growing");
  assert.strictEqual(toConfidenceLabel(0.1), "Emerging");

  console.log("✅ Presentation layer labels passed.");
}

// ─── Test 9: Composability — Adding a new identity without modifying engine ──
{
  const customDefinition = {
    id: "test-custom",
    displayName: "Test Custom",
    behaviors: [{ behavior: "novelty" as const, weight: 1.0 }],
    why: () => "Custom why",
    reflection: "Custom reflection?",
  };

  const result = inferIdentity(customDefinition, highExplorerInput, null);
  assert.strictEqual(result.id, "test-custom");
  assert.ok(Math.abs(result.score - 0.9) < 0.01, "Custom identity should use novelty directly");
  assert.strictEqual(result.why, "Custom why");
  assert.strictEqual(result.reflection, "Custom reflection?");

  console.log("✅ Composability test passed (new identity without engine modification).");
}

console.log("🎉 All Inference Engine v1 tests completed successfully!");
