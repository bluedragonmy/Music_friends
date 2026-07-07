import { JournalRepository, SyncLogBaselineProvider } from "./repository";
import { observationRules, getRarityScore } from "./observation-library";
import { generateCandidateJournals } from "./observation-engine";
import { getCoupledReflection } from "./reflections";
import type { BehaviorBaseline, BehaviorBaselineProvider } from "./types";

// ── 預設 Provider（第一版：SyncLog Rolling Window）──────────────
// 未來換成 Redis / Cache / Materialized View 時，只改這一行。
/**
 * Baseline is an implementation detail.
 * Narrative Engine should never know
 * where it comes from.
 */
const baselineProvider: BehaviorBaselineProvider = new SyncLogBaselineProvider();

// ── 輔助函數 ──────────────────────────────────────────────────

function renderTemplate(templateStr: string, variables: Record<string, any>): string {
  let result = templateStr;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return result;
}

// Importance：每個 category 的固有重要性（0.0 ~ 1.0）
function getImportance(category: string): number {
  if (category === "moment" || category === "remembering") return 1.0;
  if (category === "echo" || category === "change") return 0.8;
  if (category === "pattern") return 0.6;
  return 0.5;
}

// Unexpectedness：基於 BehaviorBaseline 的 Z-Score 計算
// 當 sampleCount < 3 時，回退為 1.0（不放大也不縮小）
function calculateUnexpectedness(
  variables: Record<string, any>,
  baseline: BehaviorBaseline
): number {
  if (baseline.sampleCount < 3) return 1.0;

  let maxAbsZ = 0;

  // 對每個有數據的維度計算 Z-Score
  const dimensions: { key: string; varKey: string; scale: number }[] = [
    { key: "novelty", varKey: "noveltyPercent", scale: 100 },
    { key: "repeatRate", varKey: "repeatPercent", scale: 100 },
    { key: "genreDiversity", varKey: "genresCount", scale: 10 },
  ];

  for (const dim of dimensions) {
    const rawValue = variables[dim.varKey];
    if (rawValue === undefined || rawValue === null) continue;

    const value = rawValue / dim.scale; // 正規化到 0~1
    const mean = baseline.mean[dim.key as keyof typeof baseline.mean];
    const std = baseline.std[dim.key as keyof typeof baseline.std];

    if (std < 0.01) continue; // 標準差太小，該維度無變異

    const z = Math.abs((value - mean) / std);
    maxAbsZ = Math.max(maxAbsZ, z);
  }

  // Unexpectedness = 1.0 + min(|Z|, 3.0) × 0.4
  // Z=0 → 1.0（平凡）, Z=2 → 1.8（顯著偏離）, Z=3+ → 2.2（極端）
  return 1.0 + Math.min(maxAbsZ, 3.0) * 0.4;
}

// ── Narrative Score = Importance × Unexpectedness × Confidence ──
// 這是唯一的排序公式。沒有 if-else。
// 未來新增維度（Novel, Rare, Seasonal, Echo, Memory）只需要乘新的 score。

// ── 主函數 ────────────────────────────────────────────────────

export async function getOrCreateRewindQueue(userId: string, now: Date = new Date(), minRewinds: number = 3) {
  let entries = await JournalRepository.getJournalTimeline(userId);

  // 取得行為基線（Narrative Engine 不知道資料從哪裡來）
  const baseline = await baselineProvider.getBaseline(userId, now);

  // 如果已有的日誌數量不足 minRewinds，開始向過去追溯生成（最長 180 天以利挖掘 forgotten/memory 類別）
  if (entries.length < minRewinds) {
    const maxSearchDays = 180;
    let dayOffset = 0;

    while (entries.length < minRewinds && dayOffset <= maxSearchDays) {
      const targetDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);

      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);

      const dayHasEntry = entries.some(e => {
        const d = new Date(e.date);
        return d >= startOfDay && d < endOfDay;
      });

      if (!dayHasEntry) {
        const candidates = await generateCandidateJournals(userId, targetDate);

        if (candidates.length > 0) {
          const cooldownMap = new Map<string, Date>();
          entries.forEach(e => {
            const prev = cooldownMap.get(e.observationId);
            const eDate = new Date(e.date);
            if (!prev || eDate > prev) {
              cooldownMap.set(e.observationId, eDate);
            }
          });

          const scoredCandidates = candidates.map(candidate => {
            const rule = observationRules.find(r => r.id === candidate.observationId);
            if (!rule) return null;

            // 冷卻檢查
            const lastSeen = cooldownMap.get(candidate.observationId);
            if (lastSeen) {
              const daysSinceLastSeen = (targetDate.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);
              if (daysSinceLastSeen < rule.cooldown) return null;
            }

            // Narrative Score = Importance × Unexpectedness × Confidence
            const importance = getImportance(rule.category);
            const unexpectedness = calculateUnexpectedness(candidate.variables, baseline);
            const narrativeScore = importance * unexpectedness * candidate.confidence;

            return { candidate, rule, narrativeScore };
          }).filter((x): x is NonNullable<typeof x> => x !== null);

          if (scoredCandidates.length > 0) {
            scoredCandidates.sort((a, b) => b.narrativeScore - a.narrativeScore);
            const selected = scoredCandidates[0];
            const { candidate, rule } = selected;

            const bodyText = `${rule.microcopy.loop_step_1}\n\n${rule.microcopy.loop_step_2}\n\n${rule.microcopy.loop_step_3}`;
            const renderedBody = renderTemplate(bodyText, candidate.variables);
            const renderedReflection = getCoupledReflection(rule.id, candidate.variables);

            // TODO(v1.0): Split evidence JSON into distinct tables after Beta validation: ObservationEvidence, Reflection, and Feedback.
            // 尋找過去是否有針對此 observationId 留下的 reflection
            const pastReflectionEntry = entries.find(e => 
              e.observationId === candidate.observationId && 
              e.evidence && 
              typeof e.evidence === "object" && 
              (e.evidence as any).userWrittenReflection
            );

            let pastReflectionData = null;
            if (pastReflectionEntry) {
              const pastDate = new Date(pastReflectionEntry.date);
              const pastDateStr = `${pastDate.getFullYear()} / ${String(pastDate.getMonth() + 1).padStart(2, "0")} / ${String(pastDate.getDate()).padStart(2, "0")}`;
              pastReflectionData = {
                date: pastDateStr,
                content: (pastReflectionEntry.evidence as any).userWrittenReflection
              };
            }

            const evidenceJson: Record<string, any> = {
              evidence: {
                ...candidate.variables
              },
              metadata: {
                observationVersion: rule.version || "1.0",
                narrativeVersion: "3.0",
                engine: "Z-Score Engine",
                generatedAt: new Date().toISOString()
              },
              ruleVersion: rule.version || "1.0",
            };

            if (pastReflectionData) {
              evidenceJson.pastReflection = pastReflectionData;
            }

            await JournalRepository.createJournalEntry({
              userId,
              date: targetDate,
              observationId: candidate.observationId,
              title: rule.title,
              body: renderedBody,
              evidence: evidenceJson,
              reflection: renderedReflection
            });

            entries = await JournalRepository.getJournalTimeline(userId);
          }
        }
      }
      dayOffset++;
    }
  }

  // Rewind Queue 排序：用 Narrative Score 排序整個 timeline
  // Note: Journal entries are not static; their scores are calculated dynamically during query time based on the active rolling baseline. 
  // This makes old journals living documents whose relevance fluctuates (Recoverability).
  const sortedQueue = [...entries].sort((a, b) => {
    const ruleA = observationRules.find(r => r.id === a.observationId);
    const ruleB = observationRules.find(r => r.id === b.observationId);

    const scoreA = getImportance(ruleA?.category || "") * calculateUnexpectedness((a.evidence as Record<string, any>) || {}, baseline);
    const scoreB = getImportance(ruleB?.category || "") * calculateUnexpectedness((b.evidence as Record<string, any>) || {}, baseline);

    if (Math.abs(scoreA - scoreB) > 0.01) return scoreB - scoreA;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return sortedQueue;
}

// 向後相容
export async function getOrCreateTodayJournal(userId: string, now: Date = new Date()) {
  const queue = await getOrCreateRewindQueue(userId, now);
  if (queue.length === 0) return null;

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const todayEntry = queue.find(e => {
    const d = new Date(e.date);
    return d >= todayStart && d < todayEnd;
  });

  return todayEntry || queue[0];
}
