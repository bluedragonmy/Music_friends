import { prisma } from "../prisma";
import { observationRules } from "./observation-library";
import { generateCandidateJournals } from "./observation-engine";
import { CandidateJournal, ObservationRule } from "./types";

// 輔助函數：取代字串中的變數標記, e.g., "{noveltyPercent}" -> 82
function renderTemplate(templateStr: string, variables: Record<string, any>): string {
  let result = templateStr;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return result;
}

export async function getOrCreateTodayJournal(userId: string, now: Date = new Date()) {
  // 1. 檢查今日是否已經有產生日誌 (同一天, 以當地/UTC 日期判斷)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const existingEntry = await prisma.journalEntry.findFirst({
    where: {
      userId,
      date: {
        gte: startOfToday,
        lt: endOfToday
      }
    }
  });

  if (existingEntry) {
    return existingEntry;
  }

  // 2. 今日尚未產生日誌，呼叫 Observation Engine 產生候選名單
  const candidates = await generateCandidateJournals(userId, now);
  if (candidates.length === 0) {
    return null; // 無足夠數據產生候選
  }

  // 3. 取得過去 30 天內該使用者已產生的日誌，以執行冷卻機制 (Freshness)
  const startOfCooldown = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const pastEntries = await prisma.journalEntry.findMany({
    where: {
      userId,
      date: {
        gte: startOfCooldown,
        lt: now
      }
    },
    select: {
      observationId: true,
      date: true
    }
  });

  const lastSeenMap = new Map<string, Date>();
  pastEntries.forEach(entry => {
    const prev = lastSeenMap.get(entry.observationId);
    if (!prev || entry.date > prev) {
      lastSeenMap.set(entry.observationId, entry.date);
    }
  });

  // 4. 過濾與評分排序
  const scoredCandidates = candidates.map(candidate => {
    const rule = observationRules.find(r => r.id === candidate.observationId);
    if (!rule) return null;

    // 檢查冷卻時間 (Cooldown / Freshness)
    const lastSeen = lastSeenMap.get(candidate.observationId);
    if (lastSeen) {
      const daysSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastSeen < rule.cooldown) {
        // 在冷卻期內，分數大幅降為 0
        return null;
      }
    }

    // 計算綜合排序分數 (Ranking Score)
    // 基礎分 = Rarity Score (25 ~ 100)
    let score = candidate.rarityScore;

    // Priority 權重乘數
    const priorityMultiplier = rule.priority === "high" ? 1.5 : rule.priority === "medium" ? 1.0 : 0.5;
    score *= priorityMultiplier;

    // 置信度乘數
    score *= candidate.confidence;

    return {
      candidate,
      rule,
      score
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  if (scoredCandidates.length === 0) {
    // 若所有規則皆在冷卻或無合適者，放寬限制，挑選一個最基本的規則 (例如 obs_repetition_collector 或 obs_novelty_explorer)
    // 這裡我們直接排序原本的 candidates
    const fallbackCandidates = candidates.map(candidate => {
      const rule = observationRules.find(r => r.id === candidate.observationId);
      return rule ? { candidate, rule, score: candidate.rarityScore } : null;
    }).filter((x): x is NonNullable<typeof x> => x !== null);

    if (fallbackCandidates.length > 0) {
      scoredCandidates.push(...fallbackCandidates);
    } else {
      return null;
    }
  }

  // 5. 排序並挑選出最高分的一筆
  scoredCandidates.sort((a, b) => b.score - a.score);
  const selected = scoredCandidates[0];
  const { candidate, rule } = selected;

  // 6. 套用模板進行渲染
  const bodyText = `${rule.microcopy.loop_step_1}\n\n${rule.microcopy.loop_step_2}\n\n${rule.microcopy.loop_step_3}`;
  
  // 變數替換
  const title = rule.title;
  const renderedBody = renderTemplate(bodyText, candidate.variables);
  const renderedReflection = renderTemplate(rule.reflection, candidate.variables);

  // 7. 寫入資料庫
  const newEntry = await prisma.journalEntry.create({
    data: {
      userId,
      date: now,
      observationId: candidate.observationId,
      title,
      body: renderedBody,
      evidence: candidate.variables,
      reflection: renderedReflection
    }
  });

  return newEntry;
}
