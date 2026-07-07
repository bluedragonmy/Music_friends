import { SEED_EDGES, EdgeType } from "../edge";
import { SEED_ENTITIES, Entity } from "../entity";

function getEntityYearRange(entity: Entity): { start: number; end: number } | null {
  if (entity.metadata?.birthYear !== undefined) {
    const start = entity.metadata.birthYear;
    const end = entity.metadata.deathYear ?? 2026;
    return { start, end };
  }
  if (entity.metadata?.activeYears !== undefined) {
    return {
      start: entity.metadata.activeYears[0],
      end: entity.metadata.activeYears[1]
    };
  }
  if (entity.metadata?.year !== undefined) {
    const yr = parseInt(entity.metadata.year, 10);
    if (!isNaN(yr)) {
      return { start: yr, end: yr };
    }
  }
  return null;
}

function runConsistencyCheck() {
  console.log("=== Starting Graph Consistency & Temporal Checks ===");
  let hasErrors = false;
  let errorCount = 0;

  const entityMap = new Map(SEED_ENTITIES.map(e => [e.id, e]));

  for (const edge of SEED_EDGES) {
    const source = entityMap.get(edge.source);
    const target = entityMap.get(edge.target);

    if (!source || !target) continue;

    // 1. 拓撲角色合法性檢驗 (Role Validity)
    // PRODUCED: source 必須為 artist 或 producer, target 必須為 song 或 album
    if (edge.type === "PRODUCED") {
      if (source.type !== "artist" && source.type !== "producer") {
        console.error(`[ERROR] Role Violation: '${edge.source}' (${source.type}) cannot be the source of PRODUCED. Must be artist or producer.`);
        hasErrors = true;
        errorCount++;
      }
      if (target.type !== "song" && target.type !== "album") {
        console.error(`[ERROR] Role Violation: '${edge.target}' (${target.type}) cannot be the target of PRODUCED. Must be song or album.`);
        hasErrors = true;
        errorCount++;
      }
    }

    // SIGNED_TO: source 必須為 artist, target 必須為 label
    if (edge.type === "SIGNED_TO") {
      if (source.type !== "artist") {
        console.error(`[ERROR] Role Violation: '${edge.source}' (${source.type}) cannot be SIGNED_TO. Source must be artist.`);
        hasErrors = true;
        errorCount++;
      }
      if (target.type !== "label") {
        console.error(`[ERROR] Role Violation: '${edge.target}' (${target.type}) cannot be target of SIGNED_TO. Target must be label.`);
        hasErrors = true;
        errorCount++;
      }
    }

    // WROTE: source 必須為 artist 或 producer, target 必須為 song
    if (edge.type === "WROTE") {
      if (source.type !== "artist" && source.type !== "producer") {
        console.error(`[ERROR] Role Violation: '${edge.source}' (${source.type}) cannot write songs. Must be artist or producer.`);
        hasErrors = true;
        errorCount++;
      }
      if (target.type !== "song") {
        console.error(`[ERROR] Role Violation: '${edge.target}' (${target.type}) cannot be the target of WROTE. Must be song.`);
        hasErrors = true;
        errorCount++;
      }
    }

    // 2. 時空年代一致性檢驗 (Temporal Consistency)
    const srcRange = getEntityYearRange(source);
    const tgtRange = getEntityYearRange(target);

    if (srcRange && tgtRange) {
      // 2.1 出道年與生年差合理性檢驗
      // 藝人的出道年/活躍起點與出生年差距大於 60 年，這非常可疑
      if (source.metadata?.birthYear !== undefined && source.metadata?.activeYears !== undefined) {
        const gap = source.metadata.activeYears[0] - source.metadata.birthYear;
        if (gap > 60 || gap < 0) {
          console.error(`[ERROR] Temporal Paradox in '${source.id}': birthYear is ${source.metadata.birthYear} but activeYears start is ${source.metadata.activeYears[0]} (gap of ${gap} years).`);
          hasErrors = true;
          errorCount++;
        }
      }

      // 2.2 影響力前輩/晚輩年代合理性 (INFLUENCED)
      // source (影響源 / 前輩) 的起點年，不應該晚於 target (被影響者 / 晚輩) 的終點年 (逝世或停止活動)
      if (edge.type === "INFLUENCED") {
        if (srcRange.start > tgtRange.end) {
          console.error(`[ERROR] Influence Paradox: Predecessor '${source.id}' (starts ${srcRange.start}) cannot influence Successor '${target.id}' (ended/died in ${tgtRange.end}).`);
          hasErrors = true;
          errorCount++;
        }
      }

      // 2.3 合作關係年代重疊性 (COLLABORATED_WITH)
      // 合作兩人的活躍年代區間必須有交集 (Overlap)
      if (edge.type === "COLLABORATED_WITH") {
        const hasOverlap = (srcRange.start <= tgtRange.end) && (tgtRange.start <= srcRange.end);
        if (!hasOverlap) {
          console.error(`[ERROR] Collaboration Paradox: '${source.id}' (${srcRange.start}-${srcRange.end}) and '${target.id}' (${tgtRange.start}-${tgtRange.end}) have no temporal overlap to directly collaborate.`);
          hasErrors = true;
          errorCount++;
        }
      }
    }
  }

  console.log(`=== Consistency Check Completed: ${errorCount} Errors ===`);
  if (hasErrors) {
    console.error("❌ Graph Consistency Check failed due to temporal paradoxes or role violations.");
    process.exit(1);
  } else {
    console.log("✅ Graph Consistency Check passed successfully.");
  }
}

runConsistencyCheck();
