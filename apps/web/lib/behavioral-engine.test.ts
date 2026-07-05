import assert from "assert";
import {
  measureNovelty,
  measureRepeatRate,
  measureGenreDiversity,
  measurePeakListeningHour,
  measureSessionLength,
  calculateConfidence,
  ObservedLog,
} from "./behavioral-engine";

// Helper to create dummy observed logs
function createMockLog(overrides: Partial<ObservedLog> = {}): ObservedLog {
  return {
    trackId: "track_default",
    playedAt: new Date(),
    listenDurationMs: 3 * 60 * 1000, // 3 mins
    genres: "pop",
    popularity: 50,
    audioFeature: null,
    ...overrides,
  };
}

console.log("🧪 Running Behavioral Engine Unit Tests...");

// 1. Test measureNovelty
{
  const target = [
    createMockLog({ trackId: "song_A" }),
    createMockLog({ trackId: "song_B" }),
  ];

  // Case A: No prior history - should be 1.0 (all new)
  const priorEmpty = new Set<string>();
  const noveltyEmpty = measureNovelty(target, priorEmpty);
  assert.strictEqual(noveltyEmpty, 1.0, "Novelty must be 1.0 when prior history is empty");

  // Case B: Full match prior history - should be 0.0 (all repeated)
  const priorFull = new Set(["song_A", "song_B", "song_C"]);
  const noveltyFull = measureNovelty(target, priorFull);
  assert.strictEqual(noveltyFull, 0.0, "Novelty must be 0.0 when all tracks exist in prior history");

  // Case C: Partial match - 1 out of 2 is new (song_B is new)
  const priorPartial = new Set(["song_A"]);
  const noveltyPartial = measureNovelty(target, priorPartial);
  assert.strictEqual(noveltyPartial, 0.5, "Novelty must be 0.5 when half the tracks are new");

  console.log("✅ measureNovelty passed.");
}

// 2. Test measureRepeatRate
{
  // Case A: 5 unique tracks played once each - repeat rate should be 0
  const noRepeats = [
    createMockLog({ trackId: "song_1" }),
    createMockLog({ trackId: "song_2" }),
    createMockLog({ trackId: "song_3" }),
    createMockLog({ trackId: "song_4" }),
    createMockLog({ trackId: "song_5" }),
  ];
  assert.strictEqual(measureRepeatRate(noRepeats), 0.0, "Repeat rate must be 0.0 when no track is played >= 3 times");

  // Case B: 1 track played 3 times, 1 track played 1 time - repeated plays count is 3, total is 4 -> 3/4 = 0.75
  const partialRepeats = [
    createMockLog({ trackId: "song_A" }),
    createMockLog({ trackId: "song_A" }),
    createMockLog({ trackId: "song_A" }),
    createMockLog({ trackId: "song_B" }),
  ];
  assert.strictEqual(measureRepeatRate(partialRepeats), 0.75, "Repeat rate must be 0.75");

  console.log("✅ measureRepeatRate passed.");
}

// 3. Test measureGenreDiversity
{
  // Case A: Single genre - diversity should be 0.0
  const singleGenre = [
    createMockLog({ genres: "pop" }),
    createMockLog({ genres: "pop" }),
  ];
  assert.strictEqual(measureGenreDiversity(singleGenre), 0.0, "Single genre diversity must be 0");

  // Case B: Empty - should be 0.0
  assert.strictEqual(measureGenreDiversity([]), 0.0);

  // Case C: Diverse genres - should return non-zero positive value <= 1.0
  const multiGenres = [
    createMockLog({ genres: "pop, rock" }),
    createMockLog({ genres: "jazz" }),
    createMockLog({ genres: "classical, metal" }),
  ];
  const diversity = measureGenreDiversity(multiGenres);
  assert.ok(diversity > 0 && diversity <= 1.0, "Diversity must be between 0.0 and 1.0");

  console.log("✅ measureGenreDiversity passed.");
}

// 4. Test measurePeakListeningHour
{
  const now = new Date();
  
  // Set all tracks to be played at hour 23
  const playedHour23 = new Date(now);
  playedHour23.setHours(23, 10, 0);

  const logs = [
    createMockLog({ playedAt: playedHour23, listenDurationMs: 60000 }),
    createMockLog({ playedAt: playedHour23, listenDurationMs: 120000 }),
  ];

  // The 2-hour peak window ending at 23/00 starting hour should encompass hour 23
  const peak = measurePeakListeningHour(logs);
  assert.ok(peak === 22 || peak === 23, "Peak listening starting hour must encompass 23:00");

  console.log("✅ measurePeakListeningHour passed.");
}

// 5. Test measureSessionLength
{
  const baseTime = new Date("2026-07-04T10:00:00Z");

  // Three tracks played consecutively with a 2-minute gap (listen duration 3 mins each)
  // Total duration: 3 mins (A) + 2 mins gap + 3 mins (B) + 2 mins gap + 3 mins (C) = 13 mins.
  const sessionLogs = [
    createMockLog({ playedAt: baseTime, listenDurationMs: 180000 }), // 10:00 - 10:03
    createMockLog({ playedAt: new Date(baseTime.getTime() + 5 * 60 * 1000), listenDurationMs: 180000 }), // 10:05 - 10:08
    createMockLog({ playedAt: new Date(baseTime.getTime() + 10 * 60 * 1000), listenDurationMs: 180000 }), // 10:10 - 10:13
  ];

  const avgLen = measureSessionLength(sessionLogs);
  assert.ok(Math.abs(avgLen - 13.0) < 0.1, "Session length should be around 13 minutes");

  // Case B: Two separate sessions with 40-minute gap
  const splitLogs = [
    createMockLog({ playedAt: baseTime, listenDurationMs: 180000 }), // Session 1: 3 mins
    createMockLog({ playedAt: new Date(baseTime.getTime() + 45 * 60 * 1000), listenDurationMs: 180000 }), // Session 2: 3 mins
  ];
  const avgLenSplit = measureSessionLength(splitLogs);
  assert.ok(Math.abs(avgLenSplit - 3.0) < 0.1, "Average of two separate 3-minute sessions should be 3 minutes");

  console.log("✅ measureSessionLength passed.");
}

// 6. Test calculateConfidence
{
  const now = new Date("2026-07-04T12:00:00Z");
  
  // Case A: empty logs -> 0
  assert.strictEqual(calculateConfidence([], 30, now), 0.0);

  // Case B: 100 logs over 10 active days, very recent play -> confidence near 1.0
  const logs: ObservedLog[] = [];
  for (let i = 0; i < 100; i++) {
    // distribute over 10 days
    const logDate = new Date(now.getTime() - (i % 10) * 24 * 60 * 60 * 1000);
    logs.push(createMockLog({ playedAt: logDate }));
  }
  // Sort logs chronologically to satisfy confidence requirement of latest log
  logs.sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime());

  const confHigh = calculateConfidence(logs, 10, now);
  assert.ok(confHigh > 0.9, `Confidence should be high (> 0.9), got ${confHigh}`);

  // Case C: Stale data (last log was 30 days ago) -> decay should drastically drop confidence
  const staleDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const staleLogs = [
    createMockLog({ playedAt: staleDate }),
  ];
  const confStale = calculateConfidence(staleLogs, 30, now);
  assert.ok(confStale < 0.1, `Stale confidence should be very low (< 0.1), got ${confStale}`);

  console.log("✅ calculateConfidence passed.");
}

console.log("🎉 All Behavioral Engine tests completed successfully!");
