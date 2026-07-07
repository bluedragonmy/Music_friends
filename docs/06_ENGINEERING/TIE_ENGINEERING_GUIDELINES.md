# TIE Engineering Guidelines v1.2

本文件更新 **Taste Intelligence Model (TIM)** 開發規範，新增魔術數字排除規則與子圖快取層（Subgraph Cache）實作規範。

---

## 🛑 六大工程核心原則 (Core Engineering Rules)

*(Rule 1 至 Rule 5 保持不變，新增 Rule 6)*

### Rule 6 — No Hidden Magic Number {無隱藏魔術數字原則}
*   **規範**：所有用於計算置信度門檻、貝氏更新常數、時間衰減常數或排序權重的數值，**嚴禁**直接硬編碼（Hardcode）在業務邏輯或計算公式中。
*   **實作**：所有系統數值參數必須集中定義於設定檔 `apps/web/lib/graph/config.ts` 中。

```typescript
// config.ts 集中管理範例
export const TIM_CONFIG = {
  DECAY_CONSTANT_LAMBDA: 0.0077,       // 90天半衰期
  MIN_EVIDENCE_STRENGTH_THRESHOLD: 0.50,
  BASE_SURPRISE_WEIGHT: 1.2,
  COMPLEXITY_PENALTY_COEFFICIENT: 0.15
} as const;
```

---

## ⚡ 性能優化：子圖快取層 (Subgraph Cache Layer)

為了避免每次使用者造訪 Dashboard 時 TRE 都要對大圖執行高深度的 BFS/DFS 搜索，系統引入 `Subgraph Cache` 快取機制：

```
Music Knowledge Graph (Memory)
        │
        ▼
[Subgraph Cache (Hot Entities Cache)]  <-- 熱門藝人、製作人、廠牌關聯子圖
        │
        ▼
Taste Reasoning Engine (Inference)
```

### 快取生命週期 (Cache TTL)
1.  **熱點快取**：針對高頻訪問的 `Producer`、`Studio` 關係鏈，預先加載（Warm Up）並快取於記憶體中。
2.  **時效限制**：快取最大存活時間 (TTL) 設為 24 小時。當圖譜 `SEED_EDGES` 發生變更或部署時，自動觸發快取失效（Invalidation）。
