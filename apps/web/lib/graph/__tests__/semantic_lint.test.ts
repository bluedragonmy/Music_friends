import { SEED_EDGES, FACT_SOURCE_CONFIGS, deriveEvidenceStrength, deriveClaimType, FactSource, EdgeType } from "../edge";
import { SEED_ENTITIES } from "../entity";

// 信賴的新聞與媒體網域白名單
const TRUSTED_NEWS_DOMAINS = [
  "rollingstone.com",
  "billboard.com",
  "pitchfork.com",
  "nme.com",
  "theguardian.com",
  "npr.org",
  "fader.com",
  "residentadvisor.net",
  "bbc.co.uk",
  "bbc.com"
];

// 信賴的社群與影音網域白名單
const TRUSTED_SOCIAL_DOMAINS = [
  "instagram.com",
  "youtube.com",
  "youtu.be",
  "twitter.com",
  "x.com"
];

// 信賴的資料庫與串流網域白名單
const TRUSTED_DB_DOMAINS = [
  "musicbrainz.org",
  "discogs.com",
  "spotify.com"
];

function getHostname(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function runSemanticLint() {
  console.log("=== Starting Semantic Graph Linting ===");
  let hasErrors = false;
  let errorCount = 0;
  let warningCount = 0;

  const entityMap = new Map(SEED_ENTITIES.map(e => [e.id, e]));

  for (const edge of SEED_EDGES) {
    const sourceEntity = entityMap.get(edge.source);
    const targetEntity = entityMap.get(edge.target);

    if (!sourceEntity) {
      console.error(`[ERROR] Source entity '${edge.source}' not found in SEED_ENTITIES.`);
      hasErrors = true;
      errorCount++;
      continue;
    }
    if (!targetEntity) {
      console.error(`[ERROR] Target entity '${edge.target}' not found in SEED_ENTITIES.`);
      hasErrors = true;
      errorCount++;
      continue;
    }

    for (const evidence of edge.evidences) {
      const sources = evidence.sources;

      // 1. 檢驗是否完全沒有來源
      if (sources.length === 0) {
        console.error(`[ERROR] Edge '${edge.source} -> ${edge.target}' has evidence '${evidence.factId}' but no sources.`);
        hasErrors = true;
        errorCount++;
        continue;
      }

      // 2. 檢驗無效 Capability 組合 (無任何來源具備支持該 EdgeType 的能力)
      const validSourcesForEdge = sources.filter(s => {
        const config = FACT_SOURCE_CONFIGS[s.type];
        if (edge.type === "INFLUENCED") return config.canSupportInfluence;
        if (edge.type === "PRAISED" || edge.type === "REFERRED_TO") return config.canSupportSubjective;
        return config.canSupportObjective;
      });

      if (validSourcesForEdge.length === 0) {
        console.error(`[ERROR] Invalid Capability Combination in '${edge.source} -> ${edge.target}' (${edge.type}):`);
        console.error(`        None of the sources [${sources.map(s => s.type).join(", ")}] support the relation type '${edge.type}'.`);
        hasErrors = true;
        errorCount++;
      }

      for (const src of sources) {
        // 3. 檢驗非 Credits 來源是否有 URL
        if (src.type !== FactSource.Credits && !src.url) {
          console.error(`[ERROR] Missing URL for non-Credits source '${src.type}' in '${edge.source} -> ${edge.target}' (${evidence.factId}).`);
          hasErrors = true;
          errorCount++;
        }

        if (src.url) {
          // 4. 檢驗 URL 必須以 https:// 開頭
          if (!src.url.startsWith("https://")) {
            console.error(`[ERROR] Invalid URL protocol (must be https://): '${src.url}' in '${edge.source} -> ${edge.target}'.`);
            hasErrors = true;
            errorCount++;
          }

          const hostname = getHostname(src.url);

          // 5. 檢驗動態官網註冊域名
          if (src.type === FactSource.OfficialWebsite) {
            const officialEntities = [sourceEntity, targetEntity].filter(e => e.links?.website);
            if (officialEntities.length > 0) {
              const matchAny = officialEntities.some(e => {
                const declaredHost = getHostname(e.links!.website!);
                return declaredHost && (hostname.includes(declaredHost) || declaredHost.includes(hostname));
              });
              if (!matchAny) {
                console.error(`[ERROR] OfficialWebsite URL '${src.url}' does not match any declared website for entities [${officialEntities.map(e => e.id).join(", ")}].`);
                hasErrors = true;
                errorCount++;
              }
            }
          }

          // 6. 檢驗 News 網域白名單
          if (src.type === FactSource.News) {
            const isTrustedNews = TRUSTED_NEWS_DOMAINS.some(d => hostname === d || hostname.endsWith("." + d));
            if (!isTrustedNews) {
              console.error(`[ERROR] Untrusted News domain '${hostname}' in URL '${src.url}'. Must use trusted media sources.`);
              hasErrors = true;
              errorCount++;
            }
          }

          // 7. 檢驗 Social 網域白名單
          if (src.type === FactSource.Instagram || src.type.startsWith("YouTube")) {
            const isTrustedSocial = TRUSTED_SOCIAL_DOMAINS.some(d => hostname === d || hostname.endsWith("." + d));
            if (!isTrustedSocial) {
              console.error(`[ERROR] Untrusted Social domain '${hostname}' in URL '${src.url}'.`);
              hasErrors = true;
              errorCount++;
            }
          }
        }

        // 8. 檢驗 retrievedAt 檢索日期格式與未來日期
        if (src.retrievedAt) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(src.retrievedAt)) {
            console.error(`[ERROR] Invalid retrievedAt date format (must be YYYY-MM-DD): '${src.retrievedAt}' in '${edge.source} -> ${edge.target}'.`);
            hasErrors = true;
            errorCount++;
          } else {
            const parsedDate = Date.parse(src.retrievedAt);
            if (isNaN(parsedDate)) {
              console.error(`[ERROR] Unparseable retrievedAt date: '${src.retrievedAt}' in '${edge.source} -> ${edge.target}'.`);
              hasErrors = true;
              errorCount++;
            } else {
              const today = new Date();
              // 設定為今日的結束點
              today.setHours(23, 59, 59, 999);
              if (parsedDate > today.getTime()) {
                console.error(`[ERROR] Future retrievedAt date: '${src.retrievedAt}' (Today is ${new Date().toISOString().split("T")[0]}) in '${edge.source} -> ${edge.target}'.`);
                hasErrors = true;
                errorCount++;
              }
            }
          }
        }
      }

      // 9. 檢驗 Weak 證據強度 (分級治理：拋出 Warning，不卡 Build)
      const strength = deriveEvidenceStrength(edge.type, evidence);
      if (strength === "Weak") {
        console.warn(`[WARNING] Weak Evidence Strength detected: '${edge.source} -> ${edge.target}' (${edge.type})`);
        console.warn(`          factId: '${evidence.factId}' - Supported by lower-confidence or inferred sources.`);
        warningCount++;
      }
    }
  }

  console.log(`=== Lint Completed: ${errorCount} Errors, ${warningCount} Warnings ===`);
  if (hasErrors) {
    console.error("❌ Semantic Lint failed due to syntax or capability errors.");
    process.exit(1);
  } else {
    console.log("✅ Semantic Lint passed successfully (warnings allowed).");
  }
}

runSemanticLint();
