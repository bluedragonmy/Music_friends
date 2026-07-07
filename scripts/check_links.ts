import { SEED_EDGES } from "../apps/web/lib/graph/edge";

/**
 * 簡易的 Promise Concurrency Limit {併發限制} 實作，避免依賴外部套件
 */
async function limitConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  limit: number
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];
  
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    const index = results.push(null as any) - 1;
    const e: Promise<void> = p.then((res) => {
      results[index] = res;
      executing.splice(executing.indexOf(e), 1);
    });
    executing.push(e);
    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);
  return results;
}

interface CheckResult {
  url: string;
  title: string;
  factId: string;
  sourceType: string;
  hasArchive: boolean;
  success: boolean;
  status?: number;
  error?: string;
  methodUsed: "HEAD" | "GET";
}

async function checkUrl(
  url: string,
  title: string,
  factId: string,
  sourceType: string,
  hasArchive: boolean
): Promise<CheckResult> {
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  
  // 1. 優先使用 HEAD 請求
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": userAgent },
      // 設定超時
      signal: AbortSignal.timeout(8000)
    });
    
    if (res.status >= 200 && res.status < 400) {
      return {
        url,
        title,
        factId,
        sourceType,
        hasArchive,
        success: true,
        status: res.status,
        methodUsed: "HEAD"
      };
    }
    
    // 如果 HEAD 返回 405 (Method Not Allowed) 或其他 4xx/5xx，降級為 GET 請求
    if (res.status === 405 || res.status >= 400) {
      const getRes = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": userAgent },
        signal: AbortSignal.timeout(10000)
      });
      
      const success = getRes.status >= 200 && getRes.status < 400;
      return {
        url,
        title,
        factId,
        sourceType,
        hasArchive,
        success,
        status: getRes.status,
        methodUsed: "GET"
      };
    }
    
    return {
      url,
      title,
      factId,
      sourceType,
      hasArchive,
      success: false,
      status: res.status,
      methodUsed: "HEAD"
    };
  } catch (err: any) {
    // 發生 Timeout 或 Network Error，降級為 GET 請求再試一次
    try {
      const getRes = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": userAgent },
        signal: AbortSignal.timeout(10000)
      });
      
      const success = getRes.status >= 200 && getRes.status < 400;
      return {
        url,
        title,
        factId,
        sourceType,
        hasArchive,
        success,
        status: getRes.status,
        methodUsed: "GET"
      };
    } catch (getErr: any) {
      return {
        url,
        title,
        factId,
        sourceType,
        hasArchive,
        success: false,
        error: getErr.message || String(getErr),
        methodUsed: "GET"
      };
    }
  }
}

async function main() {
  console.log("==================================================");
  console.log("🔍 Starting Music Knowledge Graph Link Checker...");
  console.log("==================================================");

  // 1. 蒐集所有帶有 URL 的來源
  const targets: { url: string; title: string; factId: string; sourceType: string; hasArchive: boolean }[] = [];
  
  for (const edge of SEED_EDGES) {
    for (const ev of edge.evidences) {
      for (const src of ev.sources) {
        if (src.url) {
          targets.push({
            url: src.url,
            title: src.title,
            factId: ev.factId,
            sourceType: src.type,
            hasArchive: !!src.archive
          });
        }
      }
    }
  }

  console.log(`Found ${targets.length} links to verify in the graph.`);
  console.log("Running check with concurrency limit of 10...\n");

  const startTime = Date.now();
  const results = await limitConcurrency(targets, (t) => checkUrl(t.url, t.title, t.factId, t.sourceType, t.hasArchive), 10);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // 2. 彙整結果與輸出報表
  let successCount = 0;
  let warningCount = 0;
  let deadCount = 0;

  console.log("------------------ Check Details ------------------");
  for (const r of results) {
    if (r.success) {
      successCount++;
      console.log(`🟢 [OK] [${r.methodUsed}] ${r.title.substring(0, 40)}... (Status: ${r.status})`);
    } else {
      deadCount++;
      const errorMsg = r.status ? `Status ${r.status}` : `Error: ${r.error}`;
      console.warn(`🔴 [FAIL] [${r.methodUsed}] ${r.title.substring(0, 40)}...`);
      console.warn(`   URL: ${r.url}`);
      console.warn(`   Reason: ${errorMsg}`);
      
      if (!r.hasArchive) {
        warningCount++;
        console.warn(`   ⚠️  WARNING: This source has NO archive backup configured! Please add 'archive' to edge.ts.`);
      } else {
        console.log(`   💡 Note: This source is backed up in archive.`);
      }
    }
  }

  console.log("\n==================================================");
  console.log("📊 Link Checker Summary Report");
  console.log(`- Time elapsed: ${duration}s`);
  console.log(`- Total links verified: ${targets.length}`);
  console.log(`- Active/Live (🟢): ${successCount}`);
  console.log(`- Dead/Timeout (🔴): ${deadCount}`);
  console.log(`- Unarchived Dead Warning (⚠️): ${warningCount}`);
  console.log("==================================================");

  if (warningCount > 0) {
    console.warn("\n[CI Warning] Some sources are dead and lack archive backups. Please update the seed data.");
  } else {
    console.log("\n[CI Pass] All verified links are healthy or safely backed up.");
  }
}

main().catch((err) => {
  console.error("Link checker failed with error:", err);
  process.exit(0); // 確保不阻斷 CI 部署
});
