// =============================================================================
// Knowledge Audit — 音樂知識圖譜資料治理與語意審計系統
// =============================================================================

import { SEED_EDGES, LOCALIZED_FACTS, deriveClaimType, FACT_SOURCE_CONFIGS, FactSource } from "../edge";

interface AuditResult {
  edgeId: string;
  status: "PASS" | "WARNING" | "FAIL";
  factId: string;
  evidenceCount: number;
  primaryCount: number;
  secondaryCount: number;
  hasArchive: boolean;
  messages: string[];
}

function runKnowledgeAudit() {
  console.log("====================================================");
  console.log("📡 Starting Music Knowledge Graph Governance Audit");
  console.log("====================================================");

  let hasErrors = false;
  const results: AuditResult[] = [];
  
  // 紀錄 factId 已經被哪些 Edge 引用以檢查唯一性
  const factIdToEdgeMap = new Map<string, string[]>();
  // 紀錄 URL 所對應的所有 ClaimType
  const urlToClaimTypesMap = new Map<string, Set<string>>();

  // 第一階段：全局收集與初步對齊
  for (const edge of SEED_EDGES) {
    const edgeId = `${edge.source} ➡️ ${edge.type} ➡️ ${edge.target}`;
    for (const ev of edge.evidences) {
      if (ev.factId) {
        if (!factIdToEdgeMap.has(ev.factId)) {
          factIdToEdgeMap.set(ev.factId, []);
        }
        factIdToEdgeMap.get(ev.factId)!.push(edgeId);
      }
      
      const claimType = deriveClaimType(edge.type, ev.sources);
      for (const src of ev.sources) {
        if (src.url) {
          if (!urlToClaimTypesMap.has(src.url)) {
            urlToClaimTypesMap.set(src.url, new Set());
          }
          urlToClaimTypesMap.get(src.url)!.add(claimType);
        }
      }
    }
  }

  // 第二階段：逐條 Edge 審計
  for (const edge of SEED_EDGES) {
    const edgeId = `${edge.source} ➡️ ${edge.type} ➡️ ${edge.target}`;
    const messages: string[] = [];
    let isFailed = false;
    let isWarning = false;

    let primaryCount = 0;
    let secondaryCount = 0;
    let hasArchive = false;
    let factId = "None";

    // 1. 結構完整性與基本規則檢查
    if (!edge.evidences || edge.evidences.length === 0) {
      messages.push("[ERROR] Missing evidences array or empty.");
      isFailed = true;
    } else {
      for (const ev of edge.evidences) {
        factId = ev.factId;

        // A. factId 是否存在於翻譯字典
        if (!factId) {
          messages.push("[ERROR] Evidence missing factId.");
          isFailed = true;
        } else {
          const translation = (LOCALIZED_FACTS as any)[factId];
          if (!translation) {
            messages.push(`[ERROR] factId '${factId}' is not defined in LOCALIZED_FACTS.`);
            isFailed = true;
          } else {
            // B. 翻譯語義對稱性檢查
            if (!translation.zh || translation.zh.trim() === "") {
              messages.push(`[ERROR] Missing Traditional Chinese (zh) translation for factId '${factId}'.`);
              isFailed = true;
            }
            if (!translation.en || translation.en.trim() === "") {
              messages.push(`[ERROR] Missing English (en) translation for factId '${factId}'.`);
              isFailed = true;
            }
          }

          // C. factId 唯一性檢查
          const sharingEdges = factIdToEdgeMap.get(factId) || [];
          if (sharingEdges.length > 1) {
            messages.push(`[ERROR] factId '${factId}' is duplicated across multiple edges: ${sharingEdges.join(", ")}.`);
            isFailed = true;
          }
        }

        // D. Sources 檢查
        if (!ev.sources || ev.sources.length === 0) {
          messages.push("[ERROR] Evidence sources array is empty.");
          isFailed = true;
        } else {
          const claimType = deriveClaimType(edge.type, ev.sources);

          for (const src of ev.sources) {
            if (!src.type || !src.title || !src.directness) {
              messages.push(`[ERROR] Source is missing required fields (type, title, or directness). Source: ${JSON.stringify(src)}.`);
              isFailed = true;
              continue;
            }

            if (src.directness === "Primary") primaryCount++;
            if (src.directness === "Secondary") secondaryCount++;

            if (src.archive && src.archive.url && src.archive.provider) {
              hasArchive = true;
            }

            // E. Dead 連結強制備份規則
            if (src.status && src.status.availability === "Dead" && (!src.archive || !src.archive.url)) {
              messages.push(`[ERROR] Source URL is Dead but lacks a valid Wayback/Archive URL. Title: '${src.title}'.`);
              isFailed = true;
            }

            // F. 同一 URL 歸屬不同 ClaimType 警告
            if (src.url) {
              const claims = urlToClaimTypesMap.get(src.url);
              if (claims && claims.size > 1) {
                messages.push(`[WARNING] URL '${src.url}' is used across multiple edges with conflicting ClaimTypes: ${Array.from(claims).join(", ")}.`);
                isWarning = true;
              }
            }
          }

          // G. Rule B: EdgeType × ClaimType 合理性檢查 (Warning)
          if (edge.type === "INFLUENCED" && claimType === "Metadata") {
            messages.push(`[WARNING] INFLUENCED relationship '${edgeId}' relies solely on Metadata (Credits). Styles/ideas influence usually requires statement or observation.`);
            isWarning = true;
          }
          if (edge.type === "PRODUCED" && (claimType === "Inference" || claimType === "Observation")) {
            messages.push(`[WARNING] PRODUCED relationship '${edgeId}' relies solely on ${claimType}. Production credit typically requires Metadata or official release credits.`);
            isWarning = true;
          }
          if (edge.type === "PRAISED" && claimType !== "Statement") {
            messages.push(`[WARNING] PRAISED relationship '${edgeId}' is derived from ${claimType} instead of a Statement/Interview. Praise is usually a direct statement.`);
            isWarning = true;
          }
        }
      }
    }

    // 2. Rule A: 證據充分性檢查 (Warning)
    if (!isFailed && primaryCount < 1 && secondaryCount < 2) {
      messages.push(`[WARNING] Low evidence coverage: Requires at least 1 Primary source or 2 Secondary sources. (Current: ${primaryCount} Primary, ${secondaryCount} Secondary)`);
      isWarning = true;
    }

    const finalStatus = isFailed ? "FAIL" : isWarning ? "WARNING" : "PASS";
    if (isFailed) hasErrors = true;

    results.push({
      edgeId,
      status: finalStatus,
      factId,
      evidenceCount: edge.evidences?.length || 0,
      primaryCount,
      secondaryCount,
      hasArchive,
      messages
    });
  }

  // 第三階段：列印格式化審計報告
  console.log("\n====================================================");
  console.log("📊 KNOWLEDGE GRAPH AUDIT REPORT");
  console.log("====================================================");

  for (const r of results) {
    const statusColor = r.status === "FAIL" ? "❌ FAIL" : r.status === "WARNING" ? "⚠️ WARNING" : "✅ PASS";
    console.log(`\nEdge: ${r.edgeId}`);
    console.log(`Status: ${statusColor}`);
    console.log(`  Fact ID: ${r.factId}`);
    console.log(`  Evidences: ${r.evidenceCount} | Primary: ${r.primaryCount} | Secondary: ${r.secondaryCount}`);
    console.log(`  Archive Snapshot: ${r.hasArchive ? "Yes" : "No"}`);
    if (r.messages.length > 0) {
      console.log("  Audit Messages:");
      for (const msg of r.messages) {
        console.log(`    ${msg}`);
      }
    }
    console.log("----------------------------------------------------");
  }

  const total = results.length;
  const passed = results.filter(r => r.status === "PASS").length;
  const warned = results.filter(r => r.status === "WARNING").length;
  const failed = results.filter(r => r.status === "FAIL").length;

  console.log("\n====================================================");
  console.log("🏁 AUDIT SUMMARY");
  console.log(`Total Edges Reviewed : ${total}`);
  console.log(`Passed Edges         : ${passed}`);
  console.log(`Warning Edges        : ${warned}`);
  console.log(`Failed Edges         : ${failed}`);
  console.log("====================================================");

  if (hasErrors) {
    console.error("❌ Knowledge Audit Failed: One or more edges violated the structural/semantic governance rules.");
    process.exit(1);
  } else {
    console.log("✅ Knowledge Audit Passed: All edges conform to the current defined structural and semantic governance rules.");
    process.exit(0);
  }
}

runKnowledgeAudit();
